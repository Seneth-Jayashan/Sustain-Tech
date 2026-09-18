import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import Team from '@/models/Team'; // Ensure it's imported so mongoose knows about it for populate
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();

    const gameSessions = await GameSession.find({})
      .populate('teamId', 'name email role')
      .sort({ updatedAt: -1 })
      .lean();

    // Filter out the admin team itself if they accidentally started a session, or just return all players
    const playerSessions = gameSessions.filter((s: any) => s.teamId && s.teamId.role !== 'admin');

    return NextResponse.json({ success: true, sessions: playerSessions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
