import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import IntegrityLog from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { 
  processDecision, 
  calculateFinalOutcome, 
  validateConstraints, 
  createFallbackDecision 
} from '@/game/engine';
import { determineNextScenario } from '@/game/engines/scenarioEngine';
import { ROUND_DEADLINE_SECONDS } from '@/game/timer';

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

    // 1. Authoritative Server-Side Emergency Timer Verification
    const duration = gameSession.state.roundDurationSeconds || ROUND_DEADLINE_SECONDS[currentBucket] || 75;
    const roundStartTime = gameSession.state.roundStartTime ? new Date(gameSession.state.roundStartTime) : new Date();
    const roundDeadline = gameSession.state.roundDeadline 
      ? new Date(gameSession.state.roundDeadline) 
      : new Date(roundStartTime.getTime() + duration * 1000);

    const now = new Date();
    const timeSpentSeconds = Math.max(0, Math.min(duration, Math.round((now.getTime() - roundStartTime.getTime()) / 1000)));

    // Deadline check with 4-second network latency buffer
    const isTimedOut = Boolean(timeout) || (now.getTime() > (roundDeadline.getTime() + 4000));

    let finalDecision: { rankings?: string[]; allocations?: Record<string, number> };
    let emergencyFallback = false;
    let timeoutOccurred = isTimedOut;

    if (isTimedOut) {
      // Automatic server intervention when timeout window expires
      const fallbackResult = createFallbackDecision(currentBucket, { rankings, allocations });
      finalDecision = fallbackResult.decision;
      emergencyFallback = fallbackResult.emergencyFallback;
    } else {
      // 2. Normal In-Time Submission Validation
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

      // Operational constraints check
      const constraintCheck = validateConstraints(
        currentBucket, 
        { rankings, allocations }, 
        gameSession.state.resources?.emergencyBudget
      );
      if (!constraintCheck.valid) {
        return NextResponse.json({ error: constraintCheck.error }, { status: 400 });
      }

      finalDecision = { rankings, allocations };
    }

    // 3. Process the decision through the simulation engine with decision telemetry
    const newState = processDecision(
      gameSession.state, 
      session.userId, 
      finalDecision,
      {
        timeSpentSeconds,
        timeoutOccurred,
        emergencyFallback
      }
    );

    gameSession.state = newState;
    gameSession.currentUserId = session.userId;
    
    // Check if game is complete (all 6 buckets completed)
    if (newState.bucket > 6) {
      gameSession.status = 'COMPLETED';
      gameSession.finalResult = calculateFinalOutcome(newState);
    }

    gameSession.markModified('state');
    gameSession.markModified('finalResult');
    await gameSession.save();

    // Log the submission in the Integrity System
    await IntegrityLog.create({
      gameSessionId: gameSession._id,
      userId: session.userId,
      actionType: timeoutOccurred ? 'TIMEOUT_SUBMISSION' : 'SUBMISSION',
      metadata: { 
        bucket: currentBucket, 
        rankings: finalDecision.rankings, 
        allocations: finalDecision.allocations,
        timeSpentSeconds,
        timeoutOccurred,
        emergencyFallback
      }
    });

    // If active, determine the next scenario (with seeded shuffled action cards)
    let nextScenario = null;
    if (gameSession.status === 'ACTIVE') {
      nextScenario = await determineNextScenario(newState);
    }

    return NextResponse.json({ 
      success: true, 
      gameSession, 
      nextScenario,
      activeEvents: newState.activeDynamicEvents || [],
      intervention: emergencyFallback ? {
        message: `Command timeout expired on Day ${(currentBucket - 1) * 2}. Emergency contingency protocol authorized.`
      } : null
    });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

