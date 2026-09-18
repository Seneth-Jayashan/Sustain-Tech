import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import ReflectionClient from './ReflectionClient';

export default async function ReflectionPage() {
  await dbConnect();
  const session = await getSession();
  
  if (!session || !session.teamId) {
    redirect('/login');
  }

  const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'COMPLETED' });
  
  if (!gameSession) {
    redirect('/dashboard');
  }

  const stateData = JSON.parse(JSON.stringify(gameSession.state));
  const finalResultData = JSON.parse(JSON.stringify(gameSession.finalResult));

  return (
    <main className="min-h-screen bg-[var(--background)] p-4 md:p-8 flex items-center justify-center">
      <ReflectionClient finalState={stateData} result={finalResultData} teamName={session.teamName} />
    </main>
  );
}
