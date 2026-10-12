import { getInitialGameState } from '../src/game/state';
import { processDecision, calculateFinalOutcome } from '../src/game/engine';

interface StrategyTest {
  name: string;
  description: string;
  decisions: Array<{
    bucket: number;
    rankings?: string[];
    allocations?: Record<string, number>;
  }>;
}

const strategies: StrategyTest[] = [
  {
    name: '1. Balanced Multi-Hazard Resilience (Expert Baseline)',
    description: 'Adopts balanced operational priorities, disciplined capital expenditure, and harmonized water management.',
    decisions: [
      { bucket: 1, rankings: ['1A', '1D', '1C', '1B', '1E'] },
      { bucket: 2, rankings: ['2B', '2E', '2A', '2C', '2D'] },
      { bucket: 3, allocations: { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 } },
      { bucket: 4, allocations: { trucks_flood: 8, trucks_dryzone: 12, vehicles_flood: 24, vehicles_dryzone: 6, boats_flood: 20, boats_dryzone: 0 } },
      { bucket: 5, rankings: ['5A', '5C', '5E', '5B', '5D'] },
      { bucket: 6, rankings: ['6A', '6C', '6E', '6B', '6D'] },
    ]
  },
  {
    name: '2. Aggressive Flood Defender (Flood-Biased)',
    description: 'Emphasizes flood barriers and aggressive reservoir releases; starves dry-zone water supplies.',
    decisions: [
      { bucket: 1, rankings: ['1C', '1A', '1D', '1B', '1E'] },
      { bucket: 2, rankings: ['2B', '2E', '2D', '2A', '2C'] },
      { bucket: 3, allocations: { evacuation: 70, drinkingWater: 5, medicalSupplies: 10 } }, // Starves water (5M)
      { bucket: 4, allocations: { trucks_flood: 20, trucks_dryzone: 0, vehicles_flood: 30, vehicles_dryzone: 0, boats_flood: 20, boats_dryzone: 0 } },  // Zero water tankers to Dry Zone
      { bucket: 5, rankings: ['5A', '5C', '5D', '5E', '5B'] },
      { bucket: 6, rankings: ['6B', '6A', '6C', '6E', '6D'] },
    ]
  },
  {
    name: '3. Water Storage Hoarder (Drought-Biased)',
    description: 'Hoards water in reservoirs and dry-zone storage; neglects Kelani flood protection and drainage.',
    decisions: [
      { bucket: 1, rankings: ['1B', '1A', '1D', '1C', '1E'] }, // Burns 120M early on bottled water
      { bucket: 2, rankings: ['2B', '2A', '2D', '2E', '2C'] }, // Delays flood mobilization
      { bucket: 3, allocations: { evacuation: 10, drinkingWater: 50, medicalSupplies: 10 } }, // Starves evacuation (10M)
      { bucket: 4, allocations: { trucks_flood: 0, trucks_dryzone: 20, vehicles_flood: 5, vehicles_dryzone: 25, boats_flood: 5, boats_dryzone: 15 } },  // Boats to dry ground
      { bucket: 5, rankings: ['5B', '5C', '5E', '5A', '5D'] }, // Spends 100M on helicopter water, omits evacuation
      { bucket: 6, rankings: ['6C', '6A', '6E', '6B', '6D'] },
    ]
  },
  {
    name: '4. Fiscal Conservative (Treasury Preserver)',
    description: 'Minimizes spending and capital outlays; runs into severe emergency supply and operational shortages.',
    decisions: [
      { bucket: 1, rankings: ['1D', '1A', '1E', '1C', '1B'] }, // Avoids 40M drainage and 120M water
      { bucket: 2, rankings: ['2A', '2B', '2D', '2E', '2C'] }, // Minimal outlay
      { bucket: 3, allocations: { evacuation: 15, drinkingWater: 20, medicalSupplies: 15 } }, // Severe under-utilization (50M spent)
      { bucket: 4, allocations: { trucks_flood: 5, trucks_dryzone: 5, vehicles_flood: 10, vehicles_dryzone: 5, boats_flood: 5, boats_dryzone: 0 } }, // Keeps fleet in reserve
      { bucket: 5, rankings: ['5E', '5C', '5A', '5B', '5D'] }, // Freezes auxiliary budgets
      { bucket: 6, rankings: ['6E', '6A', '6D', '6C', '6B'] }, // Prioritizes donor matching
    ]
  },
  {
    name: '5. Inverted / Catastrophic Chaos',
    description: 'Inverts recommended priority, wastes treasury on panic spending, and triggers cascading crises.',
    decisions: [
      { bucket: 1, rankings: ['1E', '1B', '1C', '1D', '1A'] }, // Waits, burns 120M on bottled water, buries 1A
      { bucket: 2, rankings: ['2C', '2D', '2A', '2E', '2B'] }, // Burns 300M immediately, waits for flood to worsen
      { bucket: 3, allocations: { evacuation: 5, drinkingWater: 5, medicalSupplies: 0 } },
      { bucket: 4, allocations: { trucks_flood: 0, trucks_dryzone: 0, vehicles_flood: 0, vehicles_dryzone: 0, boats_flood: 0, boats_dryzone: 0 } },
      { bucket: 5, rankings: ['5D', '5B', '5C', '5E', '5A'] }, // Evacuate only volunteers, burn 100M on helicopter, bury 5A (-168M debt)
      { bucket: 6, rankings: ['6D', '6A', '6E', '6C', '6B'] }, // Harsh rationing, emergency donor aid matching (-133M debt)
    ]
  }
];

function runSimulations() {
  console.log('================================================================================');
  console.log('SUSTAIN-TECH: STRATEGIC SIMULATION ENGINE - MULTI-ARCHETYPE BALANCING VERIFICATION');
  console.log('================================================================================\n');

  strategies.forEach((strat, idx) => {
    let state = getInitialGameState(`sim-${idx}`);
    console.log(`--------------------------------------------------------------------------------`);
    console.log(`RUNNING: ${strat.name}`);
    console.log(`STRATEGY PROFILE: ${strat.description}`);
    console.log(`--------------------------------------------------------------------------------`);

    strat.decisions.forEach((dec) => {
      state = processDecision(state, 'sim-commander', dec);
    });

    const result = calculateFinalOutcome(state);

    console.log(`  COMPOSITE PREPAREDNESS SCORE (CPS): ${result.cps} / 100`);
    console.log(`  ENDING TIER:                        ${result.endingTier}`);
    console.log(`  OVERALL RATING:                     ${result.rating}`);
    console.log(`  FLOOD RESILIENCE:                   ${Math.round(result.breakdown.floodPreparedness)}%`);
    console.log(`  DROUGHT RESILIENCE:                 ${Math.round(result.breakdown.droughtPreparedness)}%`);
    console.log(`  TREASURY REMAINING:                 LKR ${Math.round(state.resources.emergencyBudget)}M`);
    console.log(`  COMMUNITY TRUST:                    ${Math.round(result.breakdown.communityTrust)}%`);
    console.log(`  INFORMATION QUALITY:                ${Math.round(result.breakdown.informationQuality)}%`);
    
    console.log(`  FAILURE THRESHOLDS:`);
    console.log(`    - Fiscal Insolvency:              ${result.failureStates.fiscalInsolvency ? 'BREACHED (Bankruptcy)' : 'PASSED'}`);
    console.log(`    - Catastrophic Inundation:        ${result.failureStates.catastrophicInundation ? 'BREACHED (Levees Failed)' : 'PASSED'}`);
    console.log(`    - Drought Shock:                  ${result.failureStates.droughtShock ? 'BREACHED (Dry-Zone Water Crisis)' : 'PASSED'}`);
    console.log(`    - Civil Breakdown:                ${result.failureStates.civilBreakdown ? 'BREACHED (Unrest)' : 'PASSED'}`);

    if (result.tradeoffs.length > 0) {
      console.log(`  KEY STRATEGIC TRADE-OFFS:`);
      result.tradeoffs.forEach(to => console.log(`    * ${to}`));
    }
    console.log(`\n  EXECUTIVE SUMMARY:\n  "${result.summary}"\n\n`);
  });

  console.log('================================================================================');
  console.log('ALL STRATEGY SIMULATIONS COMPLETED SUCCESSFULLY.');
  console.log('================================================================================');
}

runSimulations();
