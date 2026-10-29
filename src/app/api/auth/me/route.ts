import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import connectDB from '@/lib/mongoose';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    let email = session.email || '';
    let name = session.userName || '';
    let teamName = session.teamName || '';
    const role = session.role || 'player';
    let hasWatchedIntro = false;

    try {
      await connectDB();
      const user = await User.findById(session.userId).select('name email hasWatchedIntro').lean();
      if (user) {
        if (!email && user.email) email = user.email;
        if (!name && user.name) name = user.name;
        hasWatchedIntro = Boolean(user.hasWatchedIntro);
      }
    } catch (err) {
      console.error('[API /auth/me] Error looking up user in DB:', err);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: session.userId,
        name,
        email,
        teamId: session.teamId || '',
        teamName,
        role,
        hasWatchedIntro,
      },
    });
  } catch (error: any) {
    console.error('[API /auth/me error]:', error);
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
