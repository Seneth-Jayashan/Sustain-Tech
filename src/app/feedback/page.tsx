import { getSession } from '@/lib/session';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import FeedbackClient from './FeedbackClient';

export const metadata = {
  title: 'Mission Feedback // Sustain Tech 2026',
  description: 'Share your operative feedback, game impressions, and tactical suggestions for Sustain Tech 2026.',
};

export const dynamic = 'force-dynamic';

export default async function FeedbackPage() {
  const session = await getSession();

  let name = session?.userName || '';
  let email = session?.email || '';
  let teamName = session?.teamName || '';
  let role = session?.role || '';

  if (session?.userId && (!email || !name)) {
    try {
      await connectDB();
      const user = await User.findById(session.userId).select('name email').lean();
      if (user) {
        if (!email && user.email) email = user.email;
        if (!name && user.name) name = user.name;
      }
    } catch (err) {
      console.error('[FeedbackPage] Error looking up user by session userId:', err);
    }
  }

  return (
    <FeedbackClient
      userSession={
        session
          ? {
              name,
              email,
              teamName,
              role,
            }
          : null
      }
    />
  );
}
