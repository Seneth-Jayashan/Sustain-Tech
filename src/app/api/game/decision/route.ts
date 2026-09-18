import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';
import { applyDecision, calculateFinalOutcome } from '@/game/engine';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || !session.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rankings } = await request.json(); // Array of Action IDs

    if (!Array.isArray(rankings) || rankings.length !== 5) {
      return NextResponse.json({ error: 'Must provide exactly 5 rankings' }, { status: 400 });
    }

    const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    
    if (!gameSession) {
      return NextResponse.json({ error: 'No active game session found' }, { status: 404 });
    }

    const currentBucket = gameSession.state.currentBucket;
    
    if (currentBucket > 6) {
      return NextResponse.json({ error: 'Game already completed' }, { status: 400 });
    }

    // Apply the decision
    const newState = applyDecision(gameSession.state, {
      bucket: currentBucket,
      rankings,
    });

    gameSession.state = newState;
    
    // Check if game is over
    if (newState.currentBucket > 6) {
      gameSession.status = 'COMPLETED';
      gameSession.finalResult = calculateFinalOutcome(newState);
    }

    // Tell mongoose the Mixed type state has changed
    gameSession.markModified('state');
    await gameSession.save();

    return NextResponse.json({ success: true, gameSession });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
