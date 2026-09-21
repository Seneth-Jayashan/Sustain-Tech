import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import Team from '@/models/Team'; // Ensure it's imported so mongoose knows about it for populate
import User from '@/models/User';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Explicitly reference models so Mongoose registers them before .populate()
    if (!Team || !User) throw new Error("Models failed to load");

    const gameSessions = await GameSession.find({})
      .populate('teamId', 'name')
      .populate('currentUserId', 'name email role')
      .sort({ updatedAt: -1 })
      .lean();

    // Filter out any admin sessions (just in case they tested it)
    const playerSessions = gameSessions.filter((s: any) => {
      // If there is no currentUserId, we assume it's valid for now, or check if it's not admin
      return s.teamId && (!s.currentUserId || s.currentUserId.role !== 'admin');
    });

    return NextResponse.json({ success: true, sessions: playerSessions });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
