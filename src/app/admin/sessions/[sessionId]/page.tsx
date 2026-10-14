import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import InvestigationClient from './InvestigationClient';

export default async function AdminSessionInvestigationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  const { sessionId } = await params;

  return <InvestigationClient sessionId={sessionId} />;
}
