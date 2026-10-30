import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import IntegrityLog from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { getRoundDuration, getDefaultBucketShuffledOrder } from '@/game/timer';
import { calculateFinalOutcome } from '@/game/engine';
import { determineNextScenario } from '@/game/engines/scenarioEngine';

export async function POST() {
  try {
    await dbConnect();
    const session = await getSession();

    if (!session || !session.teamId) {
      return NextResponse.json({ error: 'Unauthorized: Valid team session required' }, { status: 401 });
    }

    // 1. Locate the active session for the team
    const gameSession = await GameSession.findOne({ 
      teamId: session.teamId, 
      status: 'ACTIVE' 
    });

    if (!gameSession) {
      // Check if session completed on Day 10
      const completedSession = await GameSession.findOne({
        teamId: session.teamId,
        status: 'COMPLETED'
      });

      if (completedSession) {
        return NextResponse.json({
          success: true,
          gameSession: completedSession,
          alreadyAcknowledged: true,
          isCompleted: true
        });
      }

      return NextResponse.json({ error: 'No active or completed game session found' }, { status: 404 });
    }

    const state = gameSession.state;

    // 2. Idempotency Check:
    // If there is no pending acknowledgment, do NOT reset timers or modify state.
    if (!state.pendingFallbackAcknowledgement) {
      const nextScenario = gameSession.status === 'ACTIVE' 
        ? await determineNextScenario(state) 
        : null;

      return NextResponse.json({
        success: true,
        gameSession,
        nextScenario,
        alreadyAcknowledged: true
      });
    }

    // 3. Clear pending acknowledgment and start next round's official decision timer
    const acknowledgedReport = state.pendingFallbackAcknowledgement;
    state.pendingFallbackAcknowledgement = null;

    const isGameComplete = state.bucket > 6;
    let finalOutcome = undefined;

    if (!isGameComplete) {
      // Record the next round's start timestamp and authoritative deadline NOW (at acknowledgment time)
      const duration = getRoundDuration(state.bucket);
      const now = new Date();
      state.roundStartTime = now.toISOString();
      state.roundDeadline = new Date(now.getTime() + duration * 1000).toISOString();
      state.roundDurationSeconds = duration;
      state.isPaused = false;
      state.roundRemainingSeconds = undefined;

      if (!state.shuffledCardOrders) {
        state.shuffledCardOrders = {};
      }
      if (!state.shuffledCardOrders[state.bucket]) {
        state.shuffledCardOrders[state.bucket] = getDefaultBucketShuffledOrder(state.seed || 'seed', state.bucket);
      }
    } else {
      finalOutcome = calculateFinalOutcome(state);
    }

    // 4. Pre-validate IntegrityLog before DB mutation
    const integrityLogDoc = new IntegrityLog({
      gameSessionId: gameSession._id,
      userId: session.userId,
      userName: session.userName || 'Anonymous Competitor',
      teamId: session.teamId,
      round: acknowledgedReport.completedBucket,
      day: acknowledgedReport.completedDay,
      actionType: 'FALLBACK_ACKNOWLEDGEMENT',
      severity: 'info',
      metadata: {
        completedBucket: acknowledgedReport.completedBucket,
        completedDay: acknowledgedReport.completedDay,
        nextBucket: state.bucket,
        roundStartTime: state.roundStartTime,
        roundDeadline: state.roundDeadline,
        isGameComplete
      },
      serverTimestamp: new Date()
    });

    await integrityLogDoc.validate();

    // 5. Persist GameSession atomically
    let updatedSession: any = null;
    let mongoSession: mongoose.ClientSession | null = null;

    try {
      mongoSession = await mongoose.startSession();
      mongoSession.startTransaction();

      updatedSession = await GameSession.findOneAndUpdate(
        { _id: gameSession._id, status: 'ACTIVE' },
        {
          $set: {
            state,
            currentUserId: session.userId,
            ...(isGameComplete ? { status: 'COMPLETED', finalResult: finalOutcome } : {})
          }
        },
        { new: true, session: mongoSession }
      );

      if (!updatedSession) {
        await mongoSession.abortTransaction();
        await mongoSession.endSession();
        return NextResponse.json({ error: 'Session state conflict or already completed' }, { status: 409 });
      }

      await integrityLogDoc.save({ session: mongoSession });
      await mongoSession.commitTransaction();
      await mongoSession.endSession();
    } catch (txError: any) {
      if (mongoSession) {
        try { await mongoSession.abortTransaction(); } catch (_) {}
        try { await mongoSession.endSession(); } catch (_) {}
      }

      const isTxNotSupported = 
        txError?.message?.includes('replica set') || 
        txError?.message?.includes('Transaction numbers are only allowed') ||
        txError?.code === 20 || 
        txError?.codeName === 'IllegalOperation';

      if (isTxNotSupported) {
        updatedSession = await GameSession.findOneAndUpdate(
          { _id: gameSession._id, status: 'ACTIVE' },
          {
            $set: {
              state,
              currentUserId: session.userId,
              ...(isGameComplete ? { status: 'COMPLETED', finalResult: finalOutcome } : {})
            }
          },
          { new: true }
        );

        if (!updatedSession) {
          return NextResponse.json({ error: 'Session state conflict or already completed' }, { status: 409 });
        }

        try {
          await integrityLogDoc.save();
        } catch (logErr) {
          console.warn('Non-fatal: Failed to log FALLBACK_ACKNOWLEDGEMENT in standalone mode:', logErr);
        }
      } else {
        throw txError;
      }
    }

    const nextScenario = updatedSession.status === 'ACTIVE'
      ? await determineNextScenario(updatedSession.state)
      : null;

    return NextResponse.json({
      success: true,
      gameSession: updatedSession,
      nextScenario,
      acknowledgedReport,
      isCompleted: updatedSession.status === 'COMPLETED'
    });
  } catch (error: any) {
    console.error('Error acknowledging fallback report:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
