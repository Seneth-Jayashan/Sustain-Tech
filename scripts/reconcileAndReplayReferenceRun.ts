import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getInitialGameState } from '../src/game/state';
import { processDecision, calculateFinalOutcome } from '../src/game/engine';
import { ACTION_MATRIX } from '../src/game/matrix';
import GameSession from '../src/models/GameSession';
import Team from '../src/models/Team';

dotenv.config();

const actionMap = new Map(ACTION_MATRIX.map(a => [a.id, a]));

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sustain-tech';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for Reference Run Execution.');

  // Find or create Reference Test Team
  let refTeam = await Team.findOne({ name: 'Reference Smoke Test Team' });
  if (!refTeam) {
    refTeam = await Team.create({ name: 'Reference Smoke Test Team' });
  }

  // Remove previous session for clean replay
  await GameSession.deleteMany({ teamId: refTeam._id });

  let state = getInitialGameState(refTeam._id.toString(), 'reference-seed-2026');
  
  const referenceSteps = [
    {
      round: 1,
      day: 0,
      label: 'Day 0: Early Warning & Uncertainty',
      rankings: ['1D', '1A', '1C', '1B', '1E'],
      expectedExecuted: ['1D', '1A', '1C']
    },
    {
      round: 2,
      day: 2,
      label: 'Day 2: Compound Hazard',
      rankings: ['2B', '2E', '2C', '2A', '2D'],
      expectedExecuted: ['2B', '2E', '2C']
    },
    {
      round: 3,
      day: 4,
      label: 'Day 4: Allocation Plan 3A',
      rankings: ['3A', '3B', '3C', '3D', '3E'],
      selectedPlanId: '3A',
      expectedExecuted: ['3A']
    },
    {
      round: 4,
      day: 6,
      label: 'Day 6: Fleet Mobilization Plan 4A',
      rankings: ['4A', '4B', '4C', '4D', '4E'],
      selectedPlanId: '4A',
      expectedExecuted: ['4A']
    },
    {
      round: 5,
      day: 8,
      label: 'Day 8: Ops & Emergency Funding',
      rankings: ['5A', '5C', '5E', '5B', '5D'],
      expectedExecuted: ['5A', '5C', '5E']
    },
    {
      round: 6,
      day: 10,
      label: 'Day 10: Recovery & External Donor Aid',
      rankings: ['6A', '6C', '6E', '6B', '6D'],
      expectedExecuted: ['6A', '6C', '6E']
    }
  ];

  console.log('\n================================================================================');
  console.log('REPLAYING CANONICAL REFERENCE SEQUENCE IN ENGINE');
  console.log('Sequence: 1D, 1A, 1C -> 2B, 2E, 2C -> Plan 3A -> Plan 4A -> 5A, 5C, 5E -> 6A, 6C, 6E');
  console.log('================================================================================\n');

  let currentTreasury = state.resources.emergencyBudget; // 500
  console.log(`Day 0 Starting Treasury: LKR ${currentTreasury}M\n`);

  for (const step of referenceSteps) {
    const prevTreasury = currentTreasury;
    state = processDecision(state, 'ref-test-user', {
      rankings: step.rankings
    });
    currentTreasury = state.resources.emergencyBudget;
    const executed = state.decisionHistory[step.round - 1].executedActionIds || [];
    
    console.log(`[Round ${step.round} | Day ${step.day}] ${step.label}`);
    console.log(`  Submitted Order:     ${step.rankings.join(', ')}`);
    console.log(`  Executed Action IDs: ${executed.join(', ')}`);

    let roundCosts = 0;
    let roundGrants = 0;

    if (step.round === 3) {
      roundCosts = 100;
      console.log(`  Detail: Plan ${step.selectedPlanId} fixed allocation cost: LKR 100M`);
    } else if (step.round === 4) {
      roundCosts = 60;
      console.log(`  Detail: Fleet Plan ${step.selectedPlanId} mobilization fee: LKR 60M`);
    } else {
      for (const actId of executed) {
        const act = actionMap.get(actId);
        const cost = act ? -act.impacts.emergencyBudget : 0;
        if (cost > 0) {
          roundCosts += cost;
          console.log(`  Detail: Action ${actId} (${act?.title}) -> Charge LKR ${cost}M`);
        } else if (cost < 0) {
          roundGrants += Math.abs(cost);
          console.log(`  Detail: Action ${actId} (${act?.title}) -> External Grant / Credit LKR ${Math.abs(cost)}M`);
        } else {
          console.log(`  Detail: Action ${actId} (${act?.title}) -> Cost LKR 0M`);
        }
      }
    }

    const netChange = currentTreasury - prevTreasury;
    const drawn = Math.max(0, -currentTreasury);
    const capacityRemaining = Math.max(0, 200 - drawn);

    console.log(`  Gross Spending:      LKR ${roundCosts}M`);
    console.log(`  External Grants:     LKR ${roundGrants}M`);
    console.log(`  Net Treasury Change: ${prevTreasury}M -> ${currentTreasury}M (${netChange > 0 ? '+' : ''}${netChange}M)`);
    console.log(`  Facility Status:     ${drawn > 0 ? `LKR ${drawn}M drawn, LKR ${capacityRemaining}M remaining` : 'No credit drawn (Positive reserve)'}\n`);
  }

  const finalResult = calculateFinalOutcome(state);

  const refUserId = new mongoose.Types.ObjectId();
  const gameSession = await GameSession.create({
    teamId: refTeam._id,
    currentUserId: refUserId,
    status: 'COMPLETED',
    state,
    finalResult
  });

  console.log('================================================================================');
  console.log('CANONICAL REFERENCE RUN FINAL OUTCOME');
  console.log('================================================================================');
  console.log(`Saved Session ID:      ${gameSession._id.toString()}`);
  console.log(`Final Treasury:        LKR ${state.resources.emergencyBudget}M`);
  console.log(`Facility Utilization:  LKR ${Math.max(0, -state.resources.emergencyBudget)}M drawn (LKR ${200 - Math.max(0, -state.resources.emergencyBudget)}M capacity remaining)`);
  console.log(`Composite Score (CPS): ${finalResult.cps} / 100`);
  console.log(`Ending Classification: ${finalResult.endingTier}`);
  console.log(`Diagnostic Scores:     Flood: ${finalResult.breakdown.floodPreparedness}% | Drought: ${finalResult.breakdown.droughtPreparedness}% | Fiscal: ${finalResult.breakdown.resourceScore}% | Info: ${finalResult.breakdown.informationQuality}% | Trust: ${finalResult.breakdown.communityTrust}% | Decision: ${finalResult.breakdown.decisionQuality}%`);
  console.log(`Calculation Breakdown:`);
  console.log(`  Baseline Weighted Sum:     ${finalResult.calculationDetails?.baselineWeightedSum}`);
  console.log(`  Fiscal Insolvency Penalty: -${finalResult.calculationDetails?.failurePenaltyPoints} pts`);
  console.log(`  Final CPS:                 ${finalResult.calculationDetails?.finalCps}`);
  console.log('================================================================================\n');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
