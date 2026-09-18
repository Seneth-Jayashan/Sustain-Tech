import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialState } from '@/game/engine';
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

    const initialState = getInitialState();
    gameSession = await GameSession.create({
      teamId: session.teamId,
      state: initialState,
    });
  }

  // Pass the raw state object to the client component
  // Use .toObject() or JSON parse/stringify to avoid passing Mongoose documents directly
  const stateData = JSON.parse(JSON.stringify(gameSession.state));

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-8">
      <DashboardClient initialState={stateData} teamName={session.teamName} />
    </main>
  );
}
