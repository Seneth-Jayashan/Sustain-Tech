import GameSession from '@/models/GameSession';
import IntegrityLog from '@/models/IntegrityLog';
import { getRoundDuration } from '@/game/timer';
import { createFallbackDecision, processDecision, calculateFinalOutcome } from '@/game/engine';
import { dispatchTeamGameCompletionEmail } from '@/lib/mail';

/**
 * Server-Authoritative Expired Round Resolver
 *
 * Ensures official tournament deadlines persist regardless of logout, browser closure,
 * or reconnection. If a round deadline elapsed while the player was logged out,
 * this function idempotently processes the timeout fallback on the next authenticated
 * request (dashboard load, state fetch, or decision submission) before the player
 * can make any decisions or receive a fresh window.
 */
export async function resolveExpiredRoundIfNecessary(gameSession: any, userId: string) {
  if (!gameSession || gameSession.status !== 'ACTIVE') return gameSession;
  const state = gameSession.state;
  if (!state || state.bucket > 6) return gameSession;

  // If the game session is paused (e.g. player not logged in) or deadline is not set, time is paused
  if (state.isPaused || !state.roundDeadline) return gameSession;

  // If a contingency report is already pending player acknowledgment, the clock is paused
  if (state.pendingFallbackAcknowledgement) return gameSession;

  const now = new Date();
  const deadlineMs = new Date(state.roundDeadline).getTime();
  const graceBufferMs = 4000; // 4-second network latency and clock jitter allowance

  // If the deadline is still in the future, return unchanged with active countdown
  if (now.getTime() <= deadlineMs + graceBufferMs) {
    return gameSession;
  }

  // The official tournament deadline elapsed while disconnected/logged out.
  // Execute the authoritative tournament timeout fallback mechanism idempotently.
  const currentBucket = state.bucket;
  const duration = getRoundDuration(currentBucket);
  const roundStartedAt = state.roundStartTime || now.toISOString();
  const roundDeadlineAt = state.roundDeadline;
  const decisionSubmittedAt = now.toISOString();
  const responseTimeMs = Math.max(0, now.getTime() - new Date(roundStartedAt).getTime());

  const fallbackResult = createFallbackDecision(
    currentBucket,
    {},
    state.resources?.emergencyBudget
  );

  const newState = processDecision(
    state,
    userId,
    fallbackResult.decision,
    {
      roundStartedAt,
      roundDeadlineAt,
      decisionSubmittedAt,
      responseTimeMs,
      roundDurationSeconds: duration,
      timedOut: true,
      fallbackApplied: true,
      decisionMode: 'tournament',
      fallbackPolicyDetails: fallbackResult.policyDetails
    }
  );

  newState.simulationMode = 'tournament';

  const isGameComplete = newState.bucket > 6;
  const finalOutcome = isGameComplete ? calculateFinalOutcome(newState) : undefined;
  const shouldMarkComplete = isGameComplete && !newState.pendingFallbackAcknowledgement;

  const integrityLogDoc = new IntegrityLog({
    gameSessionId: gameSession._id,
    userId,
    actionType: 'TIMEOUT_FALLBACK_SUBMISSION',
    metadata: {
      bucket: currentBucket,
      roundStartedAt,
      roundDeadlineAt,
      decisionSubmittedAt,
      responseTimeMs,
      roundDurationSeconds: duration,
      timedOut: true,
      fallbackApplied: true,
      decisionMode: 'tournament',
      reconnectionAutoResolve: true
    }
  });

  await integrityLogDoc.validate();

  // Atomic update matching state.bucket guarantees idempotency under concurrent reconnects
  const updatedSession = await GameSession.findOneAndUpdate(
    {
      _id: gameSession._id,
      status: 'ACTIVE',
      'state.bucket': currentBucket
    },
    {
      $set: {
        state: newState,
        currentUserId: userId,
        ...(shouldMarkComplete ? { status: 'COMPLETED', finalResult: finalOutcome } : {})
      }
    },
    { new: true }
  );

  if (updatedSession) {
    if (updatedSession.status === 'COMPLETED') {
      dispatchTeamGameCompletionEmail(String(updatedSession._id)).catch((err) => {
        console.error('[Reconnection Completion Email Trigger] Error:', err);
      });
    }
    try {
      await integrityLogDoc.save();
    } catch (logErr) {
      console.warn('Failed to save reconnection integrity log:', logErr);
    }
    return updatedSession;
  }

  // If another concurrent request processed this bucket, fetch and return authoritative state
  const latestSession = await GameSession.findById(gameSession._id);
  return latestSession || gameSession;
}
