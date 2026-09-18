import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { getInitialState } from '@/game/engine';

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
      const initialState = getInitialState();
      gameSession = await GameSession.create({
        teamId: session.teamId,
        state: initialState,
      });
    }

    return NextResponse.json({ success: true, gameSession });
  } catch (error: any) {
    console.error('Error fetching game state:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
