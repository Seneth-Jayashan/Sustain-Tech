import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getSession } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await User.findByIdAndUpdate(session.userId, { hasWatchedIntro: true });

    return NextResponse.json({ success: true, hasWatchedIntro: true });
  } catch (error: any) {
    console.error('[API /auth/intro-watched error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
