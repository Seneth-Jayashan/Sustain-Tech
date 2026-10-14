import { redirect } from 'next/navigation';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialGameState } from '@/game/state';
import { determineNextScenario } from '@/game/engines/scenarioEngine';
import { resolveExpiredRoundIfNecessary } from '@/lib/serverGameSession';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  await dbConnect();
  const session = await getSession();
  
  if (!session || !session.teamId) {
    redirect('/login');
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

    // Resolve any round deadline that expired while the team was disconnected or logged out
    gameSession = await resolveExpiredRoundIfNecessary(gameSession, session.userId);
    if (gameSession.status === 'COMPLETED') {
      redirect('/reflection');
    }
  }

  // Ensure timer and shuffle state exist on existing active sessions
  let needsSave = false;
  const currentBucket = gameSession.state.bucket || 1;
  if (!gameSession.state.pendingFallbackAcknowledgement && (!gameSession.state.roundDeadline || !gameSession.state.roundStartTime)) {
    const { getRoundDuration } = await import('@/game/timer');
    const duration = getRoundDuration(currentBucket);
    const now = new Date();
    gameSession.state.roundStartTime = now.toISOString();
    gameSession.state.roundDurationSeconds = duration;
    gameSession.state.roundDeadline = new Date(now.getTime() + duration * 1000).toISOString();
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
    <main className="min-h-screen min-h-[100dvh] bg-[var(--background)] overflow-x-hidden">
      <DashboardClient initialState={stateData} teamName={session.teamName} initialScenario={scenarioData} />
    </main>
  );
}
