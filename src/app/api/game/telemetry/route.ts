import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import IntegrityLog from '@/models/IntegrityLog';
import GameSession from '@/models/GameSession';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { actionType, metadata } = body;

    if (!actionType) {
      return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });
    }

    await dbConnect();

    // Find active game session
    const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    if (!gameSession) {
      return NextResponse.json({ error: 'No active session' }, { status: 400 });
    }

    await IntegrityLog.create({
      gameSessionId: gameSession._id,
      userId: session.userId,
      actionType,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Telemetry Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
