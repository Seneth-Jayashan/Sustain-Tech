import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import GameSession from '@/models/GameSession';
import IntegrityLog from '@/models/IntegrityLog';
import { getSession } from '@/lib/session';
import { processDecision } from '@/game/engines/stateTransitionEngine';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getSession();
    
    if (!session || !session.teamId || !session.userId) {
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

    const currentBucket = gameSession.state.bucket;
    
    if (currentBucket > 6) {
      return NextResponse.json({ error: 'Game already completed' }, { status: 400 });
    }

    // Process the decision through the new state transition engine
    const newState = await processDecision(gameSession.state, session.userId, rankings);

    gameSession.state = newState;
    gameSession.currentUserId = session.userId;
    
    // Check if game is over
    if (newState.bucket > 6) {
      gameSession.status = 'COMPLETED';
      
      // Calculate final outcome (basic example using new state structure)
      const { floodPreparedness, droughtPreparedness } = newState.scores;
      const pathway = droughtPreparedness > floodPreparedness ? 'Drought' : 'Flood';
      
      const rawCps = (floodPreparedness + droughtPreparedness) / 2;
      const cps = Math.max(0, Math.min(100, rawCps));
      
      gameSession.finalResult = {
        cps,
        pathway,
        rating: cps >= 80 ? 'Excellent' : cps >= 60 ? 'Good' : cps >= 40 ? 'Moderate' : 'Poor'
      };
    }

    // Tell mongoose the Mixed type state has changed
    gameSession.markModified('state');
    await gameSession.save();

    // Log the submission in the Integrity System
    await IntegrityLog.create({
      gameSessionId: gameSession._id,
      userId: session.userId,
      actionType: 'SUBMISSION',
      metadata: { bucket: currentBucket, rankings }
    });

    // If active, determine the next scenario to send to the client
    let nextScenario = null;
    if (gameSession.status === 'ACTIVE') {
      const { determineNextScenario } = await import('@/game/engines/scenarioEngine');
      const ActionModel = (await import('@/models/Action')).default;
      
      const scen: any = await determineNextScenario(newState);
      if (scen && scen.availableActionIds) {
        const actions = await ActionModel.find({ actionId: { $in: scen.availableActionIds } }).lean();
        scen.actions = actions.map(a => ({
          id: a.actionId,
          title: a.title,
          description: a.description
        }));
      }
      nextScenario = scen;
    }

    return NextResponse.json({ success: true, gameSession, nextScenario });
  } catch (error: any) {
    console.error('Error submitting decision:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
