import { redirect } from 'next/navigation';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialGameState } from '@/game/state';
import { determineNextScenario } from '@/game/engines/scenarioEngine';
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
  } else if (gameSession.currentUserId?.toString() !== session.userId) {
    // Update currentUserId if a different team member logs in
    gameSession.currentUserId = session.userId;
    await gameSession.save();
  }

  // Determine current scenario for the game state
  const currentScenario = await determineNextScenario(gameSession.state);

  // Pass raw serializable objects to client component
  const stateData = JSON.parse(JSON.stringify(gameSession.state));
  const scenarioData = JSON.parse(JSON.stringify(currentScenario));

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <DashboardClient initialState={stateData} teamName={session.teamName} initialScenario={scenarioData} />
    </main>
  );
}
