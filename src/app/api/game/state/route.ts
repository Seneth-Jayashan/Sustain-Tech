import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialGameState } from '@/game/state';
import { resolveExpiredRoundIfNecessary } from '@/lib/serverGameSession';

export async function GET() {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || !session.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find active game session
    let gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    
    if (!gameSession) {
      // Create new game session if none is active
      const initialState = getInitialGameState(session.teamId, crypto.randomUUID());
      gameSession = await GameSession.create({
        teamId: session.teamId,
        currentUserId: session.userId,
        state: initialState,
      });
    } else {
      // Resolve any round deadline that elapsed while disconnected or logged out
      gameSession = await resolveExpiredRoundIfNecessary(gameSession, session.userId);

      // Ensure timer and shuffle state exist on existing active sessions
      let needsSave = false;
      const b = gameSession.state.bucket || 1;
      if (!gameSession.state.pendingFallbackAcknowledgement && (!gameSession.state.roundDeadline || !gameSession.state.roundStartTime)) {
        const { getRoundDuration } = await import('@/game/timer');
        const duration = getRoundDuration(b);
        const now = new Date();
        gameSession.state.roundStartTime = now.toISOString();
        gameSession.state.roundDurationSeconds = duration;
        gameSession.state.roundDeadline = new Date(now.getTime() + duration * 1000).toISOString();
        needsSave = true;
      }
      if (!gameSession.state.shuffledCardOrders) {
        const { getDefaultBucketShuffledOrder } = await import('@/game/timer');
        gameSession.state.shuffledCardOrders = {
          [b]: getDefaultBucketShuffledOrder(gameSession.state.seed || 'seed', b)
        };
        needsSave = true;
      }
      if (gameSession.state.simulationMode !== 'tournament') {
        gameSession.state.simulationMode = 'tournament';
        needsSave = true;
      }
      if (needsSave) {
        gameSession.markModified('state');
        await gameSession.save();
      }
    }

    return NextResponse.json({ success: true, gameSession });
  } catch (error: any) {
    console.error('Error fetching game state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
