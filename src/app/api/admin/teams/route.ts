import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import Team from '@/models/Team'; // Ensure it's imported so mongoose knows about it for populate
import User from '@/models/User';
import IntegrityLog from '@/models/IntegrityLog';
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
      return s.teamId && (!s.currentUserId || s.currentUserId.role !== 'admin');
    });

    const sessionIds = playerSessions.map(s => s._id);
    const logs = await IntegrityLog.find({ gameSessionId: { $in: sessionIds } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const sessionsWithLogs = playerSessions.map((s: any) => {
      s.logs = logs.filter(l => l.gameSessionId.toString() === s._id.toString());
      return s;
    });

    return NextResponse.json({ success: true, sessions: sessionsWithLogs });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
