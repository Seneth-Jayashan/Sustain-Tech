import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialGameState } from '@/game/state';
import crypto from 'crypto';
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

  // Determine the current scenario for the state
  // We need to import determineNextScenario and populate actions
  const { determineNextScenario } = await import('@/game/engines/scenarioEngine');
  const ActionModel = (await import('@/models/Action')).default;
  
  let currentScenario: any = await determineNextScenario(gameSession.state);
  
  // Populate the available actions so the client can render them
  if (currentScenario && currentScenario.availableActionIds) {
    const actions = await ActionModel.find({ actionId: { $in: currentScenario.availableActionIds } }).lean();
    
    // Sort actions to match the order in availableActionIds, or just pass them
    currentScenario.actions = actions.map(a => ({
      id: a.actionId,
      title: a.title,
      description: a.description
    }));
  }

  // Pass the raw state object to the client component
  const stateData = JSON.parse(JSON.stringify(gameSession.state));
  const scenarioData = JSON.parse(JSON.stringify(currentScenario));

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <DashboardClient initialState={stateData} teamName={session.teamName} initialScenario={scenarioData} />
    </main>
  );
}
