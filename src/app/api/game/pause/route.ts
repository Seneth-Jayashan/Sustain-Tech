import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getRoundDuration } from '@/game/timer';

export async function POST() {
  try {
    const session = await getSession();
    if (!session || !session.teamId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    if (!gameSession || !gameSession.state) {
      return NextResponse.json({ success: true, message: 'No active session' });
    }

    if (!gameSession.state.isPaused && gameSession.state.roundDeadline) {
      const diff = Math.ceil((new Date(gameSession.state.roundDeadline).getTime() - Date.now()) / 1000);
      const remaining = Math.max(0, diff);
      gameSession.state.roundRemainingSeconds = remaining;
      gameSession.state.isPaused = true;
      gameSession.state.pausedAt = new Date().toISOString();
      gameSession.state.roundDeadline = undefined;
      gameSession.markModified('state');
      await gameSession.save();
    }

    return NextResponse.json({ success: true, paused: true });
  } catch (err: any) {
    console.error('[API /api/game/pause error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
