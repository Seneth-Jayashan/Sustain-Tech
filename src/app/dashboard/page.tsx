import { redirect } from 'next/navigation';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import User from '@/models/User';
import { getSession } from '@/lib/session';
import { getInitialGameState } from '@/game/state';
import { determineNextScenario } from '@/game/engines/scenarioEngine';
import { resolveExpiredRoundIfNecessary } from '@/lib/serverGameSession';
import { getGameAccessStatus } from '@/lib/gameAccess';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  await dbConnect();
  const session = await getSession();
  
  if (!session || !session.teamId) {
    redirect('/login');
  }

  // Guard: if tournament has not started yet, redirect player to locked holding screen
  if (session.role !== 'admin') {
    const accessStatus = await getGameAccessStatus();
    if (accessStatus.isLocked) {
      redirect('/locked');
    }
    // Mark user as having reached the dashboard / watched intro so they are never prompted again
    if (session.userId) {
      User.findByIdAndUpdate(session.userId, { hasWatchedIntro: true }).catch(() => {});
    }
  }

  let gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
  
  if (!gameSession) {
    // Check if they have a completed session
    const completedSession = await GameSession.findOne({ teamId: session.teamId, status: 'COMPLETED' });
    if (completedSession) {
      redirect('/reflection');
    }

    const initialState = getInitialGameState(session.teamId, crypto.randomUUID());
    gameSession = await GameSession.create({
      teamId: session.teamId,
      currentUserId: session.userId,
      state: initialState,
    });
  } else {
    if (gameSession.currentUserId?.toString() !== session.userId) {
      // Update currentUserId if a different team member logs in
      gameSession.currentUserId = session.userId;
      await gameSession.save();
    }

    // Resolve any round deadline that expired while the team was active
    gameSession = await resolveExpiredRoundIfNecessary(gameSession, session.userId);
    if (gameSession.status === 'COMPLETED') {
      redirect('/reflection');
    }
  }

  // Ensure timer and shuffle state exist on existing active sessions
  let needsSave = false;
  const currentBucket = gameSession.state.bucket || 1;
  const { getRoundDuration } = await import('@/game/timer');
  const duration = getRoundDuration(currentBucket);
  const now = new Date();

  // If session was paused (e.g. player was logged out), resume countdown now that player is logged in
  if (!gameSession.state.pendingFallbackAcknowledgement && (gameSession.state.isPaused || !gameSession.state.roundDeadline || !gameSession.state.roundStartTime)) {
    const remaining = typeof gameSession.state.roundRemainingSeconds === 'number' && gameSession.state.roundRemainingSeconds > 0
      ? gameSession.state.roundRemainingSeconds
      : duration;
    gameSession.state.roundStartTime = now.toISOString();
    gameSession.state.roundDurationSeconds = duration;
    gameSession.state.roundDeadline = new Date(now.getTime() + remaining * 1000).toISOString();
    gameSession.state.roundRemainingSeconds = undefined;
    gameSession.state.isPaused = false;
    gameSession.state.pausedAt = undefined;
    needsSave = true;
  }
  if (!gameSession.state.shuffledCardOrders) {
    const { getDefaultBucketShuffledOrder } = await import('@/game/timer');
    gameSession.state.shuffledCardOrders = {
      [currentBucket]: getDefaultBucketShuffledOrder(gameSession.state.seed || 'seed', currentBucket)
    };
    needsSave = true;
  }
  if (gameSession.state.simulationMode !== 'tournament') {
    gameSession.state.simulationMode = 'tournament';
    needsSave = true;
  }
  if (needsSave) {
    gameSession.markModified('state');
    await gameSession.save();
  }

  // Determine current scenario for the game state
  const currentScenario = await determineNextScenario(gameSession.state);

  // Pass raw serializable objects to client component
  const stateData = JSON.parse(JSON.stringify(gameSession.state));
  const scenarioData = JSON.parse(JSON.stringify(currentScenario));

  return (
    <main className="h-screen h-[100dvh] max-h-screen w-screen max-w-screen overflow-hidden bg-[var(--background)]">
      <DashboardClient initialState={stateData} teamName={session.teamName} initialScenario={scenarioData} />
    </main>
  );
}
