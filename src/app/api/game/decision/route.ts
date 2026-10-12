import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import IntegrityLog from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { processDecision, calculateFinalOutcome, validateConstraints } from '@/game/engine';
import { determineNextScenario } from '@/game/engines/scenarioEngine';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || !session.teamId || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { rankings, allocations } = body;

    const gameSession = await GameSession.findOne({ teamId: session.teamId, status: 'ACTIVE' });
    
    if (!gameSession) {
      return NextResponse.json({ error: 'No active game session found' }, { status: 404 });
    }

    const currentBucket = gameSession.state.bucket || 1;
    
    if (currentBucket > 6) {
      return NextResponse.json({ error: 'Game already completed' }, { status: 400 });
    }

    // 1. Validation based on round type
    const isAllocationRound = currentBucket === 3 || currentBucket === 4;

    if (!isAllocationRound) {
      if (!Array.isArray(rankings) || rankings.length !== 5) {
        return NextResponse.json({ error: 'Must provide all 5 actions in priority order' }, { status: 400 });
      }
    } else {
      // For allocation rounds, must provide either allocations map or rankings plan
      if (!allocations && (!Array.isArray(rankings) || rankings.length < 3)) {
        return NextResponse.json({ error: 'Must provide resource allocations or an allocation package' }, { status: 400 });
      }
    }

    // 2. Validate operational constraints
    const constraintCheck = validateConstraints(
      currentBucket, 
      { rankings, allocations }, 
      gameSession.state.resources?.emergencyBudget
    );
    if (!constraintCheck.valid) {
      return NextResponse.json({ error: constraintCheck.error }, { status: 400 });
    }

    // 3. Process the decision through the hybrid simulation engine
    const newState = processDecision(gameSession.state, session.userId, { rankings, allocations });

    gameSession.state = newState;
    gameSession.currentUserId = session.userId;
    
    // Check if game is complete (all 6 buckets completed)
    if (newState.bucket > 6) {
      gameSession.status = 'COMPLETED';
      gameSession.finalResult = calculateFinalOutcome(newState);
    }

    gameSession.markModified('state');
    gameSession.markModified('finalResult');
    await gameSession.save();

    // Log the submission in the Integrity System
    await IntegrityLog.create({
      gameSessionId: gameSession._id,
      userId: session.userId,
      actionType: 'SUBMISSION',
      metadata: { bucket: currentBucket, rankings, allocations }
    });

    // If active, determine the next scenario
    let nextScenario = null;
    if (gameSession.status === 'ACTIVE') {
      nextScenario = await determineNextScenario(newState);
    }

    return NextResponse.json({ 
      success: true, 
      gameSession, 
      nextScenario,
      activeEvents: newState.activeDynamicEvents || []
    });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
