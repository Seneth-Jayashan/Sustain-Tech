import AdminClient from './AdminClient';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getSession();

  // Extra safety net
  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  return <AdminClient />;
}
