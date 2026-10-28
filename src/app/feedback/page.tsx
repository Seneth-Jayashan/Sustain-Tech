import { getSession } from '@/lib/session';
import FeedbackClient from './FeedbackClient';

export const metadata = {
  title: 'Mission Feedback // Sustain Tech 2026',
  description: 'Share your operative feedback, game impressions, and tactical suggestions for Sustain Tech 2026.',
};

export default async function FeedbackPage() {
  const session = await getSession();

  return (
    <FeedbackClient
      userSession={
        session
          ? {
              name: session.userName || '',
              email: session.email || '',
              teamName: session.teamName || '',
              role: session.role || '',
            }
          : null
      }
    />
  );
}
