import { NextResponse } from 'next/server';
import { logout, getSession } from '@/lib/session';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getRoundDuration } from '@/game/timer';

export async function POST() {
  try {
    const session = await getSession();
    if (session && session.teamId) {
      await dbConnect();
      const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
      if (gameSession && gameSession.state && !gameSession.state.isPaused) {
        const b = gameSession.state.bucket || 1;
        const duration = getRoundDuration(b);
        let remaining = duration;
        if (gameSession.state.roundDeadline) {
          const diff = Math.ceil((new Date(gameSession.state.roundDeadline).getTime() - Date.now()) / 1000);
          remaining = Math.max(0, diff);
        } else if (typeof gameSession.state.roundRemainingSeconds === 'number') {
          remaining = gameSession.state.roundRemainingSeconds;
        }
        gameSession.state.roundRemainingSeconds = remaining;
        gameSession.state.isPaused = true;
        gameSession.state.pausedAt = new Date().toISOString();
        gameSession.state.roundDeadline = undefined;
        gameSession.markModified('state');
        await gameSession.save();
      }
    }
  } catch (err) {
    console.error('[API /auth/logout pause error]:', err);
  }

  await logout();
  return NextResponse.json({ success: true });
}
