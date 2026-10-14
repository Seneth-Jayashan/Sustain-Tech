import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import IntegrityLog, { IntegrityActionType } from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { 
  processDecision, 
  calculateFinalOutcome, 
  validateConstraints, 
  createFallbackDecision 
} from '@/game/engine';
import { determineNextScenario } from '@/game/engines/scenarioEngine';
import { getRoundDuration } from '@/game/timer';
import { SimulationMode } from '@/game/types';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || !session.teamId || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rankings, allocations, timeout } = body;

    const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    
    if (!gameSession) {
      return NextResponse.json({ error: 'No active game session found' }, { status: 404 });
    }

    const currentBucket = gameSession.state.bucket || 1;
    
    if (currentBucket > 6) {
      return NextResponse.json({ error: 'Game already completed' }, { status: 400 });
    }

    // Require player to acknowledge pending fallback report before authorizing next round directives
    if (gameSession.state.pendingFallbackAcknowledgement) {
      return NextResponse.json({ 
        error: 'Please acknowledge the contingency report for the previous round before authorizing new directives.',
        pendingAcknowledgment: true 
      }, { status: 400 });
    }

    // 1. Authoritative Server-Side Emergency Timer Verification
    const duration = getRoundDuration(currentBucket);
    const now = new Date();
    const decisionSubmittedAt = now.toISOString();

    // Preserve original UTC timestamps from current round; never restart clock on refresh
    const roundStartedAt = gameSession.state.roundStartTime || decisionSubmittedAt;
    const roundDeadlineAt = gameSession.state.roundDeadline 
      ? gameSession.state.roundDeadline 
      : new Date(new Date(roundStartedAt).getTime() + duration * 1000).toISOString();

    const roundStartTimeMs = new Date(roundStartedAt).getTime();
    const roundDeadlineMs = new Date(roundDeadlineAt).getTime();

    // Calculate response time on the server using accepted request timestamps (never trust client)
    const responseTimeMs = Math.max(0, now.getTime() - roundStartTimeMs);
    const roundDurationSeconds = duration;

    // Authoritative Simulation Mode: Tournament Mode only (never trust client mode)
    const decisionMode: SimulationMode = 'tournament';

    // Deadline check with 4-second network latency buffer for tournament mode
    const isDeadlinePassed = (now.getTime() > (roundDeadlineMs + 4000)) || Boolean(timeout);

    let finalDecision: { rankings?: string[]; allocations?: Record<string, number> };
    let fallbackApplied = false;
    let timedOut = false;
    let fallbackPolicyDetails: any = null;

    // TOURNAMENT MODE ONLY: Strictly enforce server-side deadline with automated fallback
    if (isDeadlinePassed) {
      const fallbackResult = createFallbackDecision(
        currentBucket, 
        { rankings, allocations },
        gameSession.state.resources?.emergencyBudget
      );
      finalDecision = fallbackResult.decision;
      fallbackApplied = fallbackResult.emergencyFallback;
      fallbackPolicyDetails = fallbackResult.policyDetails;
      timedOut = true;
    } else {
      // Normal In-Time Submission Validation
      const isAllocationRound = currentBucket === 3 || currentBucket === 4;

      if (!isAllocationRound) {
        if (!Array.isArray(rankings) || rankings.length !== 5) {
          return NextResponse.json({ error: 'Must prioritize all 5 operational actions before authorizing directives' }, { status: 400 });
        }
      } else {
        if (!allocations && (!Array.isArray(rankings) || rankings.length < 1)) {
          return NextResponse.json({ error: 'Must provide resource allocations or select a pre-authorized plan' }, { status: 400 });
        }
      }

      const constraintCheck = validateConstraints(
        currentBucket, 
        { rankings, allocations }, 
        gameSession.state.resources?.emergencyBudget
      );
      if (!constraintCheck.valid) {
        return NextResponse.json({ error: constraintCheck.error }, { status: 400 });
      }

      finalDecision = { rankings, allocations };
      fallbackApplied = false;
      timedOut = false;
    }

    // 2. Process the decision through the simulation engine with decision telemetry
    const newState = processDecision(
      gameSession.state, 
      session.userId, 
      finalDecision,
      {
        roundStartedAt,
        roundDeadlineAt,
        decisionSubmittedAt,
        responseTimeMs,
        roundDurationSeconds,
        timedOut,
        fallbackApplied,
        decisionMode,
        fallbackPolicyDetails
      }
    );

    // Keep simulationMode in state aligned to tournament
    newState.simulationMode = 'tournament';

    const isGameComplete = newState.bucket > 6;
    const finalOutcome = isGameComplete ? calculateFinalOutcome(newState) : undefined;
    const shouldMarkComplete = isGameComplete && !newState.pendingFallbackAcknowledgement;

    // 3. Pre-validate IntegrityLog document before any database mutation
    // This guarantees that enum validation or schema errors throw BEFORE the session state or treasury is touched
    const actionType: IntegrityActionType = fallbackApplied 
      ? 'TIMEOUT_FALLBACK_SUBMISSION' 
      : timedOut 
      ? 'TIMEOUT_SUBMISSION' 
      : 'SUBMISSION';

    const integrityLogDoc = new IntegrityLog({
      gameSessionId: gameSession._id,
      userId: session.userId,
      actionType,
      metadata: { 
        bucket: currentBucket, 
        rankings: finalDecision.rankings, 
        allocations: finalDecision.allocations,
        roundStartedAt,
        roundDeadlineAt,
        decisionSubmittedAt,
        responseTimeMs,
        roundDurationSeconds,
        timedOut,
        fallbackApplied,
        decisionMode
      }
    });

    await integrityLogDoc.validate();

    // 4. Atomic transaction / Consistent persistence sequence
    let updatedSession: any = null;
    let usedReplicaSetTx = false;

    let mongoSession: mongoose.ClientSession | null = null;
    try {
      mongoSession = await mongoose.startSession();
      mongoSession.startTransaction();
      usedReplicaSetTx = true;

      updatedSession = await GameSession.findOneAndUpdate(
        { 
          _id: gameSession._id, 
          status: 'ACTIVE', 
          'state.bucket': currentBucket 
        },
        {
          $set: {
            state: newState,
            currentUserId: session.userId,
            ...(shouldMarkComplete ? { status: 'COMPLETED', finalResult: finalOutcome } : {})
          }
        },
        { new: true, session: mongoSession }
      );

      if (!updatedSession) {
        await mongoSession.abortTransaction();
        await mongoSession.endSession();
        return NextResponse.json({ 
          error: 'Decision for this round has already been submitted or processed.',
          alreadySubmitted: true
        }, { status: 409 });
      }

      await integrityLogDoc.save({ session: mongoSession });
      await mongoSession.commitTransaction();
      await mongoSession.endSession();
    } catch (txError: any) {
      if (mongoSession) {
        try {
          await mongoSession.abortTransaction();
        } catch (_) {}
        try {
          await mongoSession.endSession();
        } catch (_) {}
      }

      const isTxNotSupported = 
        txError?.message?.includes('replica set') || 
        txError?.message?.includes('Transaction numbers are only allowed') ||
        txError?.code === 20 || 
        txError?.codeName === 'IllegalOperation';

      if (isTxNotSupported) {
        usedReplicaSetTx = false;
        // Standalone MongoDB fallback: atomic findOneAndUpdate with bucket concurrency check
        updatedSession = await GameSession.findOneAndUpdate(
          { 
            _id: gameSession._id, 
            status: 'ACTIVE', 
            'state.bucket': currentBucket 
          },
          {
            $set: {
              state: newState,
              currentUserId: session.userId,
              ...(shouldMarkComplete ? { status: 'COMPLETED', finalResult: finalOutcome } : {})
            }
          },
          { new: true }
        );

        if (!updatedSession) {
          return NextResponse.json({ 
            error: 'Decision for this round has already been submitted or processed.',
            alreadySubmitted: true
          }, { status: 409 });
        }

        try {
          await integrityLogDoc.save();
        } catch (logSaveError: any) {
          console.error('Critical: IntegrityLog save failed after session commit. Reverting session state to prevent inconsistent session history:', logSaveError);
          // Compensating rollback: revert GameSession state to avoid inconsistent session history
          await GameSession.findByIdAndUpdate(gameSession._id, {
            $set: {
              state: gameSession.state,
              status: gameSession.status
            }
          });
          throw new Error(`Integrity logging failure: ${logSaveError.message}. Session state rolled back.`);
        }
      } else {
        throw txError;
      }
    }

    // 5. If active, determine the next scenario
    let nextScenario = null;
    if (updatedSession.status === 'ACTIVE') {
      nextScenario = await determineNextScenario(newState);
    }

    return NextResponse.json({ 
      success: true, 
      gameSession: updatedSession, 
      nextScenario,
      activeEvents: newState.activeDynamicEvents || [],
      intervention: fallbackApplied ? {
        message: `Command deadline expired on Day ${(currentBucket - 1) * 2} (${duration}s). Emergency contingency protocol authorized.`,
        roundName: fallbackPolicyDetails?.roundName,
        planOrActions: fallbackPolicyDetails?.planOrActions,
        explanation: fallbackPolicyDetails?.explanation,
        executedActionTitles: fallbackPolicyDetails?.executedActionTitles,
        netBudgetImpact: fallbackPolicyDetails?.netBudgetImpact
      } : null,
      timing: {
        responseTimeMs,
        roundDurationSeconds,
        timedOut,
        fallbackApplied,
        decisionMode,
        atomicTransaction: usedReplicaSetTx
      }
    });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
