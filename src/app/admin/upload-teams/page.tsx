import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import UploadTeamsClient from './UploadTeamsClient';

export const metadata = {
  title: 'XLSX Team & Player Upload | Central Command Admin',
  description: 'Batch upload teams and player rosters directly from Excel spreadsheet.',
};

export default async function UploadTeamsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  return <UploadTeamsClient />;
}
