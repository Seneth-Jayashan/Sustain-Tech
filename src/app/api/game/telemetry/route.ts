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
    const { actionType, metadata, round, day, severity: customSeverity } = body;

    if (!actionType) {
      return NextResponse.json({ error: 'Missing actionType' }, { status: 400 });
    }

    await dbConnect();

    // Find active game session or most recent session for this team
    let gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    if (!gameSession) {
      gameSession = await GameSession.findOne({ teamId: session.teamId }).sort({ updatedAt: -1 });
    }

    if (!gameSession) {
      return NextResponse.json({ error: 'No game session found for team' }, { status: 404 });
    }

    // Determine default audit severity classification
    let severity = customSeverity;
    if (!severity) {
      if (actionType === 'DEADLINE_MANIPULATION_ATTEMPT') {
        severity = 'high_priority';
      } else if ([
        'VISIBILITY_CHANGE', 
        'WINDOW_BLUR', 
        'RIGHT_CLICK_ATTEMPT', 
        'COPY_PASTE_ATTEMPT', 
        'REPEATED_REQUEST', 
        'UNUSUAL_SUBMISSION_PATTERN', 
        'INVALID_SUBMISSION_ATTEMPT'
      ].includes(actionType)) {
        severity = 'review_signal';
      } else {
        severity = 'info';
      }
    }

    const currentRound = round ?? gameSession.state?.bucket ?? 1;
    const currentDay = day ?? gameSession.state?.day ?? (currentRound - 1) * 2;

    const log = await IntegrityLog.create({
      gameSessionId: gameSession._id,
      userId: session.userId,
      userName: session.userName || 'Anonymous Competitor',
      teamId: session.teamId,
      round: currentRound,
      day: currentDay,
      actionType,
      severity,
      metadata: {
        ...(metadata || {}),
        serverReceivedAt: new Date().toISOString()
      },
      serverTimestamp: new Date()
    });

    return NextResponse.json({ success: true, logId: log._id });
  } catch (error: any) {
    console.error('Telemetry Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
