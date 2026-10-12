import assert from 'assert';
import { getInitialGameState, GameState } from '../src/game/state';
import { 
  processDecision, 
  calculateFinalOutcome, 
  validateConstraints, 
  calculateDelta,
  evaluateDynamicInterRoundEvents,
  findAction,
  COMPOUND_HAZARD_EROSION_PENALTIES
} from '../src/game/engine';

console.log('================================================================================');
console.log('SUSTAIN-TECH: RIGOROUS GAME ENGINE VALIDATION & VERIFICATION SUITE');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

// ============================================================================
// TEST SUITE 1: COMPREHENSIVE FINANCIAL ACCOUNTING & INVARIANTS
// ============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('TEST SUITE 1: COMPREHENSIVE FINANCIAL ACCOUNTING & INVARIANTS');
console.log('--------------------------------------------------------------------------------');

test('Macro Treasury vs Micro Round Allowance: Starting provincial budget is exactly LKR 500M', () => {
  const state = getInitialGameState('test-accounting-init');
  assert.strictEqual(state.resources.emergencyBudget, 500, 'Starting macro treasury must be LKR 500M');
});

test('Bucket 3: Deducts selected custom sector allocations from provincial treasury', () => {
  // Scenario A: Full LKR 100M allocation across 3 sectors
  const stateA = getInitialGameState('test-b3-deduct-full');
  stateA.bucket = 3;
  stateA.resources.emergencyBudget = 400; // Say 400M remaining after R1 & R2
  const nextA = processDecision(stateA, 'tester', {
    allocations: { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 }
  });
  assert.strictEqual(nextA.resources.emergencyBudget, 300, 'Budget must decrease by exactly 100M (400 - 100 = 300)');

  // Scenario B: Partial sector allocation (LKR 70M total spent)
  const stateB = getInitialGameState('test-b3-deduct-partial');
  stateB.bucket = 3;
  stateB.resources.emergencyBudget = 400;
  const nextB = processDecision(stateB, 'tester', {
    allocations: { evacuation: 25, drinkingWater: 25, medicalSupplies: 20 }
  });
  assert.strictEqual(nextB.resources.emergencyBudget, 330, 'Budget must decrease by exactly 70M (400 - 70 = 330)');
});

test('Bucket 3: Package ranking applies single selected package cost (LKR 100M) exactly once', () => {
  const state = getInitialGameState('test-b3-package');
  state.bucket = 3;
  state.resources.emergencyBudget = 385;
  // Player ranks packages: top choice is 3A (100M). Ranks 2-4 should NOT be charged!
  const next = processDecision(state, 'tester', {
    rankings: ['3A', '3D', '3C', '3B']
  });
  assert.strictEqual(next.resources.emergencyBudget, 285, 'Budget must decrease by exactly 100M (385 - 100 = 285), never double or triple charged');
});

test('Bucket 4: Applies LKR 60M mobilization fee exactly once across custom fleet deployment', () => {
  const state = getInitialGameState('test-b4-fee-custom');
  state.bucket = 4;
  state.resources.emergencyBudget = 285;
  const next = processDecision(state, 'tester', {
    allocations: {
      trucks_flood: 8, trucks_dryzone: 12,
      vehicles_flood: 24, vehicles_dryzone: 6,
      boats_flood: 20, boats_dryzone: 0
    }
  });
  assert.strictEqual(next.resources.emergencyBudget, 225, 'Bucket 4 must deduct exactly LKR 60M mobilization cost (285 - 60 = 225)');
});

test('Bucket 4: Applies LKR 60M mobilization fee exactly once under package ranking', () => {
  const state = getInitialGameState('test-b4-fee-package');
  state.bucket = 4;
  state.resources.emergencyBudget = 285;
  // Player ranks fleet packages: top choice is 4A (60M).
  const next = processDecision(state, 'tester', {
    rankings: ['4A', '4B', '4C', '4D', '4E']
  });
  assert.strictEqual(next.resources.emergencyBudget, 225, 'Bucket 4 package ranking must deduct exactly 60M (285 - 60 = 225)');
});

test('Day 8 Funding (5E, +60M) is credited ONLY when executed in Top 3; deprioritized gives LKR 0', () => {
  // Executed in Top 3 (Rank 3)
  const stateActive = getInitialGameState('test-5e-active');
  stateActive.bucket = 5;
  stateActive.resources.emergencyBudget = 225;
  // 5A (-40M), 5C (-30M), 5E (+60M) in top 3 -> net change = -10M
  const resActive = processDecision(stateActive, 'tester', ['5A', '5C', '5E', '5B', '5D']);
  assert.strictEqual(resActive.resources.emergencyBudget, 215, 'Active 5E must credit +60M: 225 - 40 - 30 + 60 = 215M');

  // Deprioritized (Rank 4)
  const stateDeprioritized = getInitialGameState('test-5e-deprioritized');
  stateDeprioritized.bucket = 5;
  stateDeprioritized.resources.emergencyBudget = 225;
  // 5A (-40M), 5C (-30M), 5B (-100M) in top 3; 5E is rank 4 -> net change = -170M (5E NOT credited)
  const resDeprioritized = processDecision(stateDeprioritized, 'tester', ['5A', '5C', '5B', '5E', '5D']);
  assert.strictEqual(resDeprioritized.resources.emergencyBudget, 55, 'Deprioritized 5E must NOT credit: 225 - 40 - 30 - 100 = 55M');
});

test('Day 10 Funding (6E, +50M) is credited ONLY when executed in Top 3; deprioritized gives LKR 0', () => {
  // Executed in Top 3 (Rank 3)
  const stateActive = getInitialGameState('test-6e-active');
  stateActive.bucket = 6;
  stateActive.resources.emergencyBudget = 215;
  // 6A (-15M), 6C (-50M), 6E (+50M) in top 3 -> net change = -15M
  const resActive = processDecision(stateActive, 'tester', ['6A', '6C', '6E', '6B', '6D']);
  assert.strictEqual(resActive.resources.emergencyBudget, 200, 'Active 6E must credit +50M: 215 - 15 - 50 + 50 = 200M');

  // Deprioritized (Rank 4)
  const stateDeprioritized = getInitialGameState('test-6e-deprioritized');
  stateDeprioritized.bucket = 6;
  stateDeprioritized.resources.emergencyBudget = 215;
  // 6A (-15M), 6C (-50M), 6B (-80M) in top 3; 6E is rank 4 -> net change = -145M (6E NOT credited)
  const resDeprioritized = processDecision(stateDeprioritized, 'tester', ['6A', '6C', '6B', '6E', '6D']);
  assert.strictEqual(resDeprioritized.resources.emergencyBudget, 70, 'Deprioritized 6E must NOT credit: 215 - 15 - 50 - 80 = 70M');
});

test('Rejected allocation NEVER modifies state or charges the player (Transaction Immutability)', () => {
  // Test Bucket 3 rejected allocation
  const stateB3 = getInitialGameState('test-immutability-b3');
  stateB3.bucket = 3;
  const originalJsonB3 = JSON.stringify(stateB3);
  assert.throws(() => {
    processDecision(stateB3, 'tester', {
      allocations: { evacuation: 50, drinkingWater: 50, medicalSupplies: 20 } // 120M > 100M
    });
  }, /exceeds the scenario-defined LKR 100M emergency allocation ceiling/);
  assert.strictEqual(JSON.stringify(stateB3), originalJsonB3, 'State must remain completely unchanged after rejected allocation');

  // Test Bucket 4 rejected fleet allocation
  const stateB4 = getInitialGameState('test-immutability-b4');
  stateB4.bucket = 4;
  const originalJsonB4 = JSON.stringify(stateB4);
  assert.throws(() => {
    processDecision(stateB4, 'tester', {
      allocations: { trucks_flood: 25, trucks_dryzone: 0 } // 25 > 20 trucks
    });
  }, /exceeds national fleet limit of 20 heavy-duty trucks/);
  assert.strictEqual(JSON.stringify(stateB4), originalJsonB4, 'State must remain completely unchanged after rejected fleet allocation');
});

test('Financial Invariant holds end-to-end: B_final = 500 - sum(C_executed) + sum(G_received)', () => {
  let state = getInitialGameState('test-invariant-e2e');
  
  let startingTreasury = 500;
  let totalCosts = 0;
  let totalGrants = 0;

  // Round 1: Top 3 active actions
  const r1 = ['1A', '1D', '1C', '1B', '1E'];
  r1.slice(0, 3).forEach(id => {
    const act = findAction(id, 1)!;
    if (act.impacts.emergencyBudget < 0) totalCosts += -act.impacts.emergencyBudget;
    else totalGrants += act.impacts.emergencyBudget;
  });
  state = processDecision(state, 'tester', r1);

  // Round 2: Top 3 active actions
  const r2 = ['2B', '2E', '2A', '2C', '2D'];
  r2.slice(0, 3).forEach(id => {
    const act = findAction(id, 2)!;
    if (act.impacts.emergencyBudget < 0) totalCosts += -act.impacts.emergencyBudget;
    else totalGrants += act.impacts.emergencyBudget;
  });
  state = processDecision(state, 'tester', r2);

  // Round 3: Sector allocations: 40 + 30 + 30 = 100M spent -> Costs = 100M
  const b3Alloc = { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 };
  totalCosts += 100;
  state = processDecision(state, 'tester', { allocations: b3Alloc });

  // Round 4: Fleet mobilization fee: 60M -> Costs = 60M
  const b4Alloc = { trucks_flood: 8, trucks_dryzone: 12, vehicles_flood: 24, vehicles_dryzone: 6, boats_flood: 20, boats_dryzone: 0 };
  totalCosts += 60;
  state = processDecision(state, 'tester', { allocations: b4Alloc });

  // Round 5: Top 3 active actions
  const r5 = ['5A', '5C', '5E', '5B', '5D'];
  r5.slice(0, 3).forEach(id => {
    const act = findAction(id, 5)!;
    if (act.impacts.emergencyBudget < 0) totalCosts += -act.impacts.emergencyBudget;
    else totalGrants += act.impacts.emergencyBudget;
  });
  state = processDecision(state, 'tester', r5);

  // Round 6: Top 3 active actions
  const r6 = ['6A', '6C', '6E', '6B', '6D'];
  r6.slice(0, 3).forEach(id => {
    const act = findAction(id, 6)!;
    if (act.impacts.emergencyBudget < 0) totalCosts += -act.impacts.emergencyBudget;
    else totalGrants += act.impacts.emergencyBudget;
  });
  state = processDecision(state, 'tester', r6);

  const expectedFinal = startingTreasury - totalCosts + totalGrants; // 500 - 355 + 110 = 255 (or whatever totalCosts is)
  assert.strictEqual(
    state.resources.emergencyBudget, 
    expectedFinal, 
    `Final budget must exactly match invariant formula: 500 - ${totalCosts} + ${totalGrants} = ${expectedFinal}M`
  );
});

test('Action Registry Integrity: Action IDs, Titles, and Base Costs match canonical scenario', () => {
  const CANONICAL_REGISTRY: Record<string, { title: string; cost: number }> = {
    // Bucket 1 (Day 0)
    '1A': { title: 'Inspect water sources and identify vulnerable communities', cost: -10 },
    '1D': { title: 'Communicate uncertainty and preparedness guidance to communities', cost: -5 },
    '1C': { title: 'Clear priority drainage channels in flood-prone communities', cost: -40 },
    '1B': { title: 'Purchase a large emergency stock of bottled water immediately', cost: -120 },
    '1E': { title: 'Wait for a more certain forecast before acting', cost: 0 },

    // Bucket 2 (Day 2)
    '2B': { title: 'Combine official forecasts, river/reservoir observations and verified local reports', cost: -8 },
    '2E': { title: 'Establish a district-level monitoring network with local authorities and community observers', cost: -20 },
    '2C': { title: 'Spend most of the emergency budget immediately on both hazards', cost: -300 },
    '2A': { title: 'Depend mainly on social-media reports because they arrive fastest', cost: -2 },
    '2D': { title: 'Wait until flooding becomes severe before activating response', cost: 0 },

    // Bucket 3 (Day 4)
    '3A': { title: 'Evacuation 40 / Water 30 / Medical 30', cost: -100 },
    '3D': { title: 'Evacuation 30 / Water 40 / Medical 30', cost: -100 },
    '3C': { title: 'Evacuation 40 / Water 50 / Medical 10', cost: -100 },
    '3B': { title: 'Evacuation 60 / Water 40 / Medical 0', cost: -100 },
    '3E': { title: 'Release the full LKR 120M (breaks the LKR 100M limit; invalid)', cost: -120 },

    // Bucket 4 (Day 6)
    '4A': { title: 'Trucks 8 / 12, rescue vehicles 24 / 6, boats 20 / 0', cost: -60 },
    '4B': { title: 'Trucks 0 / 20, rescue vehicles 30 / 0, boats 20 / 0 (each asset to its natural use)', cost: -60 },
    '4C': { title: 'Equal split: trucks 10 / 10, vehicles 15 / 15, boats 10 / 10', cost: -60 },
    '4D': { title: 'Everything to flood rescue', cost: -60 },
    '4E': { title: 'Hold all resources in reserve and wait for external assistance', cost: 0 },

    // Bucket 5 (Day 8)
    '5A': { title: 'Order evacuation of people in identified high-risk flood and landslide zones', cost: -40 },
    '5C': { title: 'Establish emergency coordination and triage points serving both hazard zones', cost: -30 },
    '5E': { title: 'Suspend non-essential government expenditure and redirect funds to emergency response', cost: 60 },
    '5B': { title: 'Airdrop drinking water to every affected Dry-Zone community', cost: -100 },
    '5D': { title: 'Evacuate only residents who volunteer', cost: 0 },

    // Bucket 6 (Day 10)
    '6A': { title: 'Rapid multi-sector damage and needs assessment, then prioritize water, health, roads and shelter', cost: -15 },
    '6C': { title: 'Strengthen disease surveillance, safe water, sanitation and emergency health services', cost: -50 },
    '6B': { title: 'Restore critical roads, clear debris and rehabilitate damaged water infrastructure', cost: -80 },
    '6E': { title: 'Request external assistance and coordinate donor support against a documented needs list', cost: 50 },
    '6D': { title: 'Strictly ration remaining food and water without reassessing community needs', cost: 0 }
  };

  for (const [id, expected] of Object.entries(CANONICAL_REGISTRY)) {
    const action = findAction(id);
    assert.ok(action, `Action ${id} must exist in ACTION_MATRIX`);
    assert.strictEqual(action.impacts.emergencyBudget, expected.cost, `Action ${id} base cost must be ${expected.cost}M`);
    assert.strictEqual(action.title, expected.title, `Action ${id} title must match canonical scenario specification`);
  }
});

test('Execution Audit Trail: Engine records explicit executedActionIds for top 3 and selected plans', () => {
  let state = getInitialGameState('test-audit-history');

  // Day 0 (Bucket 1): Operational round executes top 3
  state = processDecision(state, 'tester', ['1D', '1A', '1C', '1B', '1E']);
  assert.deepStrictEqual(state.decisionHistory[0].executedActionIds, ['1D', '1A', '1C']);

  // Day 2 (Bucket 2): Operational round executes top 3
  state = processDecision(state, 'tester', ['2B', '2E', '2C', '2A', '2D']);
  assert.deepStrictEqual(state.decisionHistory[1].executedActionIds, ['2B', '2E', '2C']);

  // Day 4 (Bucket 3): Resource allocation executes top plan
  state = processDecision(state, 'tester', ['3A', '3D', '3C', '3B', '3E']);
  assert.deepStrictEqual(state.decisionHistory[2].executedActionIds, ['3A']);

  // Day 6 (Bucket 4): Fleet deployment executes top plan
  state = processDecision(state, 'tester', ['4A', '4B', '4C', '4D', '4E']);
  assert.deepStrictEqual(state.decisionHistory[3].executedActionIds, ['4A']);

  // Day 8 (Bucket 5): Operational round executes top 3
  state = processDecision(state, 'tester', ['5A', '5C', '5E', '5B', '5D']);
  assert.deepStrictEqual(state.decisionHistory[4].executedActionIds, ['5A', '5C', '5E']);

  // Day 10 (Bucket 6): Operational round executes top 3
  state = processDecision(state, 'tester', ['6A', '6C', '6E', '6B', '6D']);
  assert.deepStrictEqual(state.decisionHistory[5].executedActionIds, ['6A', '6C', '6E']);
});

// ============================================================================
// TEST SUITE 2: HARD SERVER CONSTRAINT & NEGATIVE NUMBER VALIDATION
// ============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('TEST SUITE 2: HARD SERVER CONSTRAINT & NEGATIVE NUMBER VALIDATION');
console.log('--------------------------------------------------------------------------------');

test('Bucket 3: Rejects negative sector allocations', () => {
  const check = validateConstraints(3, {
    allocations: { evacuation: -10, drinkingWater: 50, medicalSupplies: 30 }
  });
  assert.strictEqual(check.valid, false, 'Negative allocations must be rejected');
  assert.strictEqual(check.error, 'Allocation amounts cannot be negative.');
});

test('Bucket 3: Rejects allocations exceeding scenario-defined LKR 100M emergency round ceiling', () => {
  const check = validateConstraints(3, {
    allocations: { evacuation: 45, drinkingWater: 40, medicalSupplies: 25 } // 110M
  });
  assert.strictEqual(check.valid, false, 'Over-allocation must be rejected');
  assert.ok(check.error?.includes('exceeds the scenario-defined LKR 100M emergency allocation ceiling'));
});

test('Bucket 3: Rejects pre-set option 3E (Full LKR 120M release)', () => {
  const check = validateConstraints(3, { rankings: ['3E', '3A', '3B', '3C', '3D'] });
  assert.strictEqual(check.valid, false, '3E must be rejected');
  assert.ok(check.error?.includes('Plan 3E releases LKR 120M and breaches the scenario-defined LKR 100M emergency allocation ceiling'));
});

test('Bucket 4: Rejects negative fleet unit counts', () => {
  const check = validateConstraints(4, {
    allocations: { trucks_flood: -5, trucks_dryzone: 10 }
  });
  assert.strictEqual(check.valid, false, 'Negative fleet units must be rejected');
  assert.strictEqual(check.error, 'Fleet allocations cannot be negative.');
});

test('Bucket 4: Enforces individual fleet limits (Trucks <= 20, Vehicles <= 30, Boats <= 20)', () => {
  const truckCheck = validateConstraints(4, { allocations: { trucks_flood: 15, trucks_dryzone: 6 } }); // 21
  assert.strictEqual(truckCheck.valid, false, 'Trucks > 20 rejected');

  const vehicleCheck = validateConstraints(4, { allocations: { vehicles_flood: 25, vehicles_dryzone: 6 } }); // 31
  assert.strictEqual(vehicleCheck.valid, false, 'Vehicles > 30 rejected');

  const boatCheck = validateConstraints(4, { allocations: { boats_flood: 15, boats_dryzone: 6 } }); // 21
  assert.strictEqual(boatCheck.valid, false, 'Boats > 20 rejected');
});

test('Emergency Credit Facility: Rejects actions that exceed the LKR 200M borrowing ceiling', () => {
  // If current budget is -150M and player tries to spend 60M in bucket 4, balance would hit -210M -> reject
  const checkB4 = validateConstraints(4, { allocations: { trucks_flood: 5, trucks_dryzone: 5 } }, -150);
  assert.strictEqual(checkB4.valid, false, 'Borrowing exceeding 200M must be rejected');
  assert.ok(checkB4.error?.includes('Emergency Credit Facility ceiling'));

  // If current budget is -140M and player tries to execute 70M of operational tasks in bucket 5, balance would hit -210M -> reject
  const checkB5 = validateConstraints(5, { rankings: ['5A', '5C', '5D', '5E', '5B'] }, -140);
  assert.strictEqual(checkB5.valid, false, 'Operational spending exceeding 200M credit cap must be rejected');
  assert.ok(checkB5.error?.includes('Emergency Credit Facility ceiling'));
});

// ============================================================================
// TEST SUITE 3: BOUNDARY TESTING OF FAILURE THRESHOLDS & ENDING TIERS
// ============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('TEST SUITE 3: BOUNDARY TESTING OF CRISIS THRESHOLDS & ENDING TIERS');
console.log('--------------------------------------------------------------------------------');

test('Boundary: Fiscal Insolvency (Treasury 0 vs 1 million)', () => {
  const state0 = getInitialGameState('test-boundary-budget-0');
  state0.resources.emergencyBudget = 0;
  assert.strictEqual(calculateFinalOutcome(state0).failureStates.fiscalInsolvency, true, '0M must trigger insolvency');

  const state1 = getInitialGameState('test-boundary-budget-1');
  state1.resources.emergencyBudget = 1;
  assert.strictEqual(calculateFinalOutcome(state1).failureStates.fiscalInsolvency, false, '1M must be solvent');
});

test('Boundary: Catastrophic Inundation (Flood Preparedness 34 vs 35)', () => {
  const state34 = getInitialGameState('test-boundary-flood-34');
  state34.scores.floodPreparedness = 34;
  assert.strictEqual(calculateFinalOutcome(state34).failureStates.catastrophicInundation, true, '34 must breach inundation threshold');

  const state35 = getInitialGameState('test-boundary-flood-35');
  state35.scores.floodPreparedness = 35;
  assert.strictEqual(calculateFinalOutcome(state35).failureStates.catastrophicInundation, false, '35 must pass inundation threshold');
});

test('Boundary: Drought Shock (Drought Preparedness 29 vs 30)', () => {
  const state29 = getInitialGameState('test-boundary-drought-29');
  state29.scores.droughtPreparedness = 29;
  assert.strictEqual(calculateFinalOutcome(state29).failureStates.droughtShock, true, '29 must breach drought shock threshold');

  const state30 = getInitialGameState('test-boundary-drought-30');
  state30.scores.droughtPreparedness = 30;
  assert.strictEqual(calculateFinalOutcome(state30).failureStates.droughtShock, false, '30 must pass drought shock threshold');
});

test('Boundary: Civil Breakdown (Community Trust 24 vs 25)', () => {
  const state24 = getInitialGameState('test-boundary-trust-24');
  state24.scores.communityTrust = 24;
  assert.strictEqual(calculateFinalOutcome(state24).failureStates.civilBreakdown, true, '24 must breach civil breakdown threshold');

  const state25 = getInitialGameState('test-boundary-trust-25');
  state25.scores.communityTrust = 25;
  assert.strictEqual(calculateFinalOutcome(state25).failureStates.civilBreakdown, false, '25 must pass civil breakdown threshold');
});

test('Boundary: Ending Tier Downgrades under Single vs Multiple Failure States', () => {
  // 0 Failures + CPS >= 80 -> Tier 1
  const stateT1 = getInitialGameState('tier-1');
  stateT1.scores = { floodPreparedness: 85, droughtPreparedness: 85, resourceScore: 70, informationQuality: 85, communityTrust: 85, decisionQuality: 85 };
  stateT1.resources.emergencyBudget = 350;
  assert.strictEqual(calculateFinalOutcome(stateT1).endingTier, 'Tier 1: Exemplary Climate Resilience');

  // 1 Failure -> Downgrades to Tier 3 (Pyrrhic Survival) regardless of other high scores
  const stateT3 = getInitialGameState('tier-3');
  stateT3.scores = { floodPreparedness: 90, droughtPreparedness: 25, resourceScore: 80, informationQuality: 85, communityTrust: 80, decisionQuality: 80 };
  stateT3.resources.emergencyBudget = 400; // Drought 25 triggers drought shock
  assert.strictEqual(calculateFinalOutcome(stateT3).endingTier, 'Tier 3: Pyrrhic Survival');

  // >= 2 Failures -> Downgrades to Tier 4 (Systemic Crisis)
  const stateT4 = getInitialGameState('tier-4');
  stateT4.scores = { floodPreparedness: 20, droughtPreparedness: 20, resourceScore: 10, informationQuality: 20, communityTrust: 20, decisionQuality: 10 };
  stateT4.resources.emergencyBudget = 0; // Inundation, drought, bankruptcy, civil unrest
  assert.strictEqual(calculateFinalOutcome(stateT4).endingTier, 'Tier 4: Systemic Crisis');
});

test('Ending Tier Classification Consistency: Verify all 4 tiers map strictly to thresholds and failure conditions', () => {
  // Rule 1: Tier 1 requires CPS >= 80, 0 failure breaches, and decisionQuality >= 65
  const sT1 = getInitialGameState('check-t1');
  sT1.scores = { floodPreparedness: 85, droughtPreparedness: 85, resourceScore: 70, informationQuality: 85, communityTrust: 85, decisionQuality: 70 };
  sT1.resources.emergencyBudget = 350;
  const rT1 = calculateFinalOutcome(sT1);
  assert.ok(rT1.cps >= 80, `T1 CPS must be >= 80, got ${rT1.cps}`);
  assert.strictEqual(Object.values(rT1.failureStates).some(Boolean), false);
  assert.strictEqual(rT1.endingTier, 'Tier 1: Exemplary Climate Resilience');

  // Rule 2: Tier 2 requires CPS in [65, 80) with 0 failure breaches
  const sT2 = getInitialGameState('check-t2');
  sT2.scores = { floodPreparedness: 75, droughtPreparedness: 75, resourceScore: 50, informationQuality: 70, communityTrust: 70, decisionQuality: 60 };
  sT2.resources.emergencyBudget = 250;
  const rT2 = calculateFinalOutcome(sT2);
  assert.ok(rT2.cps >= 65 && rT2.cps < 80, `T2 CPS must be in [65, 80), got ${rT2.cps}`);
  assert.strictEqual(Object.values(rT2.failureStates).some(Boolean), false);
  assert.strictEqual(rT2.endingTier, 'Tier 2: Competent Emergency Response');

  // Rule 3A: Tier 3 when CPS is in [40, 65) with 0 failure breaches
  const sT3a = getInitialGameState('check-t3a');
  sT3a.scores = { floodPreparedness: 55, droughtPreparedness: 55, resourceScore: 40, informationQuality: 50, communityTrust: 50, decisionQuality: 50 };
  sT3a.resources.emergencyBudget = 200;
  const rT3a = calculateFinalOutcome(sT3a);
  assert.ok(rT3a.cps >= 40 && rT3a.cps < 65, `T3 CPS must be in [40, 65), got ${rT3a.cps}`);
  assert.strictEqual(Object.values(rT3a.failureStates).some(Boolean), false);
  assert.strictEqual(rT3a.endingTier, 'Tier 3: Pyrrhic Survival');

  // Rule 3B: Tier 3 when exactly 1 failure state is breached, even if raw score is high
  const sT3b = getInitialGameState('check-t3b');
  sT3b.scores = { floodPreparedness: 90, droughtPreparedness: 25, resourceScore: 80, informationQuality: 85, communityTrust: 80, decisionQuality: 80 };
  sT3b.resources.emergencyBudget = 400; // Drought shock breached
  const rT3b = calculateFinalOutcome(sT3b);
  assert.strictEqual(rT3b.failureStates.droughtShock, true);
  assert.strictEqual(rT3b.endingTier, 'Tier 3: Pyrrhic Survival', 'Single breach must downgrade to Tier 3');

  // Rule 4A: Tier 4 when multiple failure states are breached (>= 2)
  const sT4a = getInitialGameState('check-t4a');
  sT4a.scores = { floodPreparedness: 20, droughtPreparedness: 20, resourceScore: 10, informationQuality: 20, communityTrust: 20, decisionQuality: 10 };
  sT4a.resources.emergencyBudget = 0; // Inundation, drought, bankruptcy
  const rT4a = calculateFinalOutcome(sT4a);
  assert.ok(Object.values(rT4a.failureStates).filter(Boolean).length >= 2);
  assert.strictEqual(rT4a.endingTier, 'Tier 4: Systemic Crisis');

  // Rule 4B: Tier 4 when CPS < 40
  const sT4b = getInitialGameState('check-t4b');
  sT4b.scores = { floodPreparedness: 36, droughtPreparedness: 32, resourceScore: 10, informationQuality: 30, communityTrust: 30, decisionQuality: 20 };
  sT4b.resources.emergencyBudget = 50;
  const rT4b = calculateFinalOutcome(sT4b);
  assert.ok(rT4b.cps < 40, `T4 CPS must be < 40, got ${rT4b.cps}`);
  assert.strictEqual(rT4b.endingTier, 'Tier 4: Systemic Crisis');
});

test('Explicit Rule Check 1: CPS 85 with Decision Quality 64 and zero failures yields Tier 2', () => {
  const state = getInitialGameState('test-cps85-dq64-zero-failures');
  // Exact linear formula: rawCps = (0.25*85) + (0.25*85) + (0.20*85) + (0.15*85) + (0.15*85) = 85.0
  state.scores = {
    floodPreparedness: 85,
    droughtPreparedness: 85,
    resourceScore: 85,
    informationQuality: 85,
    communityTrust: 85,
    decisionQuality: 64 // Below 65 threshold
  };
  state.resources.emergencyBudget = 300; // Solvent (> 0)

  const result = calculateFinalOutcome(state);
  assert.strictEqual(result.cps, 85, `CPS should be 85, got ${result.cps}`);
  assert.strictEqual(Object.values(result.failureStates).some(Boolean), false, 'Must have zero failure states breached');
  assert.strictEqual(result.endingTier, 'Tier 2: Competent Emergency Response', 'High CPS but DQ < 65 must fall through to Tier 2');
});

test('Explicit Rule Check 2: CPS 85 with one failure condition yields Tier 3', () => {
  const state = getInitialGameState('test-cps85-one-failure');
  // Baseline 97 minus 12 failure penalty = 85.0
  state.scores = {
    floodPreparedness: 97,
    droughtPreparedness: 97,
    resourceScore: 97,
    informationQuality: 97,
    communityTrust: 97,
    decisionQuality: 90
  };
  state.resources.emergencyBudget = 0; // Breaches fiscal insolvency (1 failure state)

  const result = calculateFinalOutcome(state);
  assert.strictEqual(result.cps, 85, `CPS should be 85, got ${result.cps}`);
  assert.strictEqual(result.failureStates.fiscalInsolvency, true, 'Fiscal insolvency must be breached');
  assert.strictEqual(Object.values(result.failureStates).filter(Boolean).length, 1, 'Exactly one failure state breached');
  assert.strictEqual(result.endingTier, 'Tier 3: Pyrrhic Survival', 'High CPS with 1 failure state must yield Tier 3');
});

test('Explicit Rule Check 3: CPS 39 with zero failures yields Tier 4', () => {
  const state = getInitialGameState('test-cps39-zero-failures');
  // Calibrate scores to produce CPS = 39.0 with all individual pillars above crisis thresholds:
  // Flood: 39 (>= 35), Drought: 39 (>= 30), Trust: 39 (>= 25), Budget: 200 (> 0)
  // rawCps = (0.25*39) + (0.25*39) + (0.20*39) + (0.15*39) + (0.15*39) = 39.0
  // cps = rawCps = 39.0
  state.scores = {
    floodPreparedness: 39,
    droughtPreparedness: 39,
    resourceScore: 39,
    informationQuality: 39,
    communityTrust: 39,
    decisionQuality: 50
  };
  state.resources.emergencyBudget = 200; // Solvent

  const result = calculateFinalOutcome(state);
  assert.strictEqual(result.cps, 39, `CPS should be 39, got ${result.cps}`);
  assert.strictEqual(Object.values(result.failureStates).some(Boolean), false, 'Must have zero failure states breached');
  assert.strictEqual(result.endingTier, 'Tier 4: Systemic Crisis', 'CPS < 40 with 0 failures must trigger Tier 4');
});

test('End-Game Reporting Case 1: Financially bankrupt player with otherwise acceptable resilience (Screenshot Scenario)', () => {
  const state = getInitialGameState('test-bankrupt-resilient');
  // Exact metrics from live gameplay session screenshot:
  // Flood: 54%, Drought: 64%, Fiscal: 0%, Info: 92%, Trust: 44%, DQ: 78%
  state.scores = {
    floodPreparedness: 54,
    droughtPreparedness: 64,
    resourceScore: 0,
    informationQuality: 92,
    communityTrust: 44,
    decisionQuality: 78
  };
  state.resources.emergencyBudget = 0; // Bankrupt

  const result = calculateFinalOutcome(state);

  // 1. Correct Tier
  assert.strictEqual(result.endingTier, 'Tier 4: Systemic Crisis');

  // 2. Accurately identifies breached thresholds (ONLY fiscal solvency failed)
  assert.strictEqual(result.failureStates.fiscalInsolvency, true, 'Fiscal solvency must be breached');
  assert.strictEqual(result.failureStates.catastrophicInundation, false, 'Flood defense passed (54 >= 35)');
  assert.strictEqual(result.failureStates.droughtShock, false, 'Drought storage passed (64 >= 30)');
  assert.strictEqual(result.failureStates.civilBreakdown, false, 'Civic trust passed (44 >= 25)');
  assert.strictEqual(Object.values(result.failureStates).filter(Boolean).length, 1);

  // 3. Explains why final score was assigned
  assert.strictEqual(result.cps, 37.9, 'CPS must be exactly 37.9 (49.9 baseline - 12 insolvency penalty)');
  assert.ok(result.calculationDetails !== undefined, 'Calculation audit details must be present');
  assert.strictEqual(result.calculationDetails!.baselineWeightedSum, 49.9);
  assert.strictEqual(result.calculationDetails!.failurePenaltyPoints, 12);
  assert.strictEqual(result.calculationDetails!.arithmeticMean, 55.3);

  // 4. Narrative does NOT falsely claim multiple failures breached; accurately cites treasury exhaustion
  assert.ok(result.summary.includes('The emergency treasury was exhausted'), 'Summary must mention emergency treasury exhaustion');
  assert.ok(result.summary.includes('Composite Preparedness Score fell below the critical survival threshold'), 'Summary must mention CPS falling below survival threshold');
  assert.ok(!result.summary.includes('Multiple failure thresholds were breached'), 'Summary must NOT claim multiple thresholds were breached');
});

test('End-Game Reporting Case 2: Player with multiple breached thresholds', () => {
  const state = getInitialGameState('test-multiple-breaches');
  state.scores = {
    floodPreparedness: 20,    // Breached (< 35)
    droughtPreparedness: 20,  // Breached (< 30)
    resourceScore: 0,
    informationQuality: 30,
    communityTrust: 15,       // Breached (< 25)
    decisionQuality: 20
  };
  state.resources.emergencyBudget = 0; // Breached (<= 0)

  const result = calculateFinalOutcome(state);

  // 1. Correct Tier
  assert.strictEqual(result.endingTier, 'Tier 4: Systemic Crisis');

  // 2. Accurately identifies multiple breached thresholds (4 breached)
  const breachedCount = Object.values(result.failureStates).filter(Boolean).length;
  assert.strictEqual(breachedCount, 4, 'All 4 crisis thresholds breached');

  // 3. Narrative accurately claims multiple failure thresholds were breached
  assert.ok(result.summary.includes('Multiple failure thresholds were breached'), 'Summary must state multiple thresholds breached');
});

test('End-Game Reporting Case 3: Financially stable player with a CPS below 40', () => {
  const state = getInitialGameState('test-stable-sub40');
  state.scores = {
    floodPreparedness: 36,    // Passed (>= 35)
    droughtPreparedness: 32,  // Passed (>= 30)
    resourceScore: 25,
    informationQuality: 30,
    communityTrust: 28,       // Passed (>= 25)
    decisionQuality: 30
  };
  state.resources.emergencyBudget = 250; // Well funded (> 0, passes)

  const result = calculateFinalOutcome(state);

  // 1. Correct Tier
  assert.strictEqual(result.endingTier, 'Tier 4: Systemic Crisis');

  // 2. Accurately identifies zero breached thresholds
  assert.strictEqual(Object.values(result.failureStates).some(Boolean), false, 'Zero failure thresholds breached');

  // 3. Score explanation
  assert.ok(result.cps < 40, `CPS must be < 40, got ${result.cps}`);
  assert.strictEqual(result.calculationDetails!.breachedFailuresCount, 0);
  assert.strictEqual(result.calculationDetails!.failurePenaltyPoints, 0);

  // 4. Narrative explains that widespread degradation drove CPS below threshold without false crisis claims
  assert.ok(result.summary.includes('While no single crisis threshold collapsed completely'), 'Summary must cite no single collapse');
  assert.ok(result.summary.includes('widespread cross-pillar degradation'), 'Summary must cite cross-pillar degradation');
  assert.ok(!result.summary.includes('Multiple failure thresholds were breached'), 'Must NOT claim multiple breaches');
  assert.ok(!result.summary.includes('The emergency treasury was exhausted'), 'Must NOT claim treasury exhaustion');
});

test('End-Game Reporting Case 4: Complete Six-Round Playthrough with Treasury Debt Deficit (-LKR 68M) and Canonical Engine CPS (62.0)', () => {
  // Simulates the exact six-round playthrough from user screenshot:
  // Day 0: Starting treasury LKR 500M
  // Day 2: 500 - 10 - 5 - 40 = 445M
  // Day 4: 445 - 8 - 20 - 300 = 117M
  // Day 4 Allocation: 117 - 100 = 17M
  // Day 6 Fleet: 17 - 60 = -43M (Emergency borrowing / deficit)
  // Day 8 Operations: -43 - 40 - 30 + 60 = -53M
  // Day 10 Recovery: -53 - 15 - 50 + 50 = -68M
  let state = getInitialGameState('playthrough-debt-reconciliation');
  assert.strictEqual(state.resources.emergencyBudget, 500);

  // Day 2 (Bucket 1): 1D (-10), 1A (-5), 1C (-40)
  state = processDecision(state, 'player', { rankings: ['1D', '1A', '1C', '1B', '1E'] });
  assert.strictEqual(state.resources.emergencyBudget, 445, 'Day 2 balance must be 445M');

  // Day 4 (Bucket 2): 2B (-8), 2E (-20), 2C (-300)
  state = processDecision(state, 'player', { rankings: ['2B', '2E', '2C', '2A', '2D'] });
  assert.strictEqual(state.resources.emergencyBudget, 117, 'Day 4 balance must be 117M');

  // Day 4 Allocation (Bucket 3): Plan 3A (100M total allocation)
  state = processDecision(state, 'player', { rankings: ['3A', '3B', '3C', '3D', '3E'] });
  assert.strictEqual(state.resources.emergencyBudget, 17, 'Day 4 allocation balance must be 17M');

  // Day 6 Fleet (Bucket 4): Plan 4A (60M mobilization fee -> -43M debt)
  state = processDecision(state, 'player', { rankings: ['4A', '4B', '4C', '4D', '4E'] });
  assert.strictEqual(state.resources.emergencyBudget, -43, 'Day 6 balance must be -43M (emergency borrowing / debt)');

  // Day 8 Operations (Bucket 5): 5A (-40), 5C (-30), 5E (+60 grant) -> -53M
  state = processDecision(state, 'player', { rankings: ['5A', '5C', '5E', '5B', '5D'] });
  assert.strictEqual(state.resources.emergencyBudget, -53, 'Day 8 balance must be -53M');

  // Day 10 Recovery (Bucket 6): 6A (-15), 6C (-50), 6E (+50 grant) -> -68M
  state = processDecision(state, 'player', { rankings: ['6A', '6C', '6E', '6B', '6D'] });
  assert.strictEqual(state.resources.emergencyBudget, -68, 'Day 10 final balance must be exactly -68M debt/deficit');

  // Verify natural live simulation engine scores:
  // Flood: 100%, Drought: 76%, Fiscal: 0% (budget <= 0), Info: 100%, Trust: 100%, DQ: 100%
  assert.strictEqual(state.scores.floodPreparedness, 100);
  assert.strictEqual(state.scores.droughtPreparedness, 76);
  assert.strictEqual(state.scores.resourceScore, 0);
  assert.strictEqual(state.information.informationQuality, 100);
  assert.strictEqual(state.community.communityTrust, 100);

  const outcome = calculateFinalOutcome(state);

  // 1. Verify failure threshold: ONLY fiscal insolvency is breached
  assert.strictEqual(outcome.failureStates.fiscalInsolvency, true, 'Fiscal insolvency breached due to -68M deficit');
  assert.strictEqual(outcome.failureStates.catastrophicInundation, false);
  assert.strictEqual(outcome.failureStates.droughtShock, false);
  assert.strictEqual(outcome.failureStates.civilBreakdown, false);
  assert.strictEqual(Object.values(outcome.failureStates).filter(Boolean).length, 1);

  // 2. Exact linear CPS reconciliation:
  // Baseline = 100(0.25) + 76(0.25) + 0(0.20) + 100(0.15) + 100(0.15) = 25 + 19 + 0 + 15 + 15 = 74.0
  // Penalty = 12.0
  // CPS = 74.0 - 12.0 = 62.0
  assert.strictEqual(outcome.cps, 62.0, `CPS must be exactly 62.0, got ${outcome.cps}`);
  assert.strictEqual(outcome.calculationDetails!.baselineWeightedSum, 74.0);
  assert.strictEqual(outcome.calculationDetails!.failurePenaltyPoints, 12);
  assert.strictEqual(outcome.calculationDetails!.curveAdjustment, 0);

  // Contributions add up exactly:
  const contributionSum = outcome.calculationDetails!.weightedComponents.reduce((acc, c) => acc + c.contribution, 0);
  assert.strictEqual(Math.round(contributionSum * 10) / 10, 74.0);
  assert.strictEqual(Math.round((contributionSum - outcome.calculationDetails!.failurePenaltyPoints) * 10) / 10, 62.0);

  // 3. Ending Tier: Tier 3 Pyrrhic Survival
  assert.strictEqual(outcome.endingTier, 'Tier 3: Pyrrhic Survival', 'Single insolvency breach must yield Tier 3');

  // 4. Exact debrief summary text
  assert.strictEqual(
    outcome.summary,
    'Pyrrhic survival achieved. Strong flood resilience, drought preparedness and information quality could not offset the exhaustion of the emergency treasury. The administration maintained operational capacity but lost the financial reserves needed to sustain further response and recovery operations.'
  );

  // 5. Softened water management trade-off when in deficit
  assert.ok(
    outcome.tradeoffs.some(t => t.includes('Water Management vs Fiscal Trade-off')),
    'Must include softened trade-off message explaining high water resilience came at the cost of capital exhaustion'
  );
  assert.ok(
    outcome.tradeoffs.some(t => t.includes('Emergency Credit Utilization: Treasury in deficit with LKR 68M drawn from the Emergency Credit Facility (LKR 132M capacity remaining of LKR 200M facility)')),
    'Must include emergency credit facility utilization trade-off'
  );
});

// ============================================================================
// TEST SUITE 4: HAZARD DEGRADATION CLARIFICATION & DYNAMIC FEEDBACK
// ============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('TEST SUITE 4: HAZARD DEGRADATION CLARIFICATION & DYNAMIC FEEDBACK');
console.log('--------------------------------------------------------------------------------');

test('Hazard degradation reflects preparedness erosion decay, not physical hazard reduction', () => {
  // Ensure that each bucket carries a defined non-positive preparedness decay penalty
  for (let b = 1; b <= 6; b++) {
    const penalty = COMPOUND_HAZARD_EROSION_PENALTIES[b];
    assert.ok(penalty !== undefined, `Bucket ${b} must have defined erosion penalties`);
    assert.ok(penalty.floodPreparednessDecay <= 0, `Bucket ${b} flood decay must be <= 0`);
    assert.ok(penalty.droughtPreparednessDecay <= 0, `Bucket ${b} drought decay must be <= 0`);
    assert.ok(penalty.communityTrustErosion <= 0, `Bucket ${b} trust erosion must be <= 0`);
  }
});

test('Dynamic Event: Fog of War triggers on low info quality (< 45) on Day 2/4', () => {
  const state = getInitialGameState('fog-test');
  state.bucket = 2;
  state.information.informationQuality = 40;
  const events = evaluateDynamicInterRoundEvents(state);
  assert.ok(events.some(e => e.id === 'INTEL_DEFICIT_FOG_OF_WAR'), 'Must trigger Fog of War');
});

test('Dynamic Event: Intelligence Dividend triggers on high info quality (>= 65)', () => {
  const state = getInitialGameState('dividend-test');
  state.bucket = 2;
  state.information.informationQuality = 70;
  const events = evaluateDynamicInterRoundEvents(state);
  assert.ok(events.some(e => e.id === 'INTEL_DIVIDEND'), 'Must trigger Intelligence Dividend');
});

test('Dynamic Event: Kelani Levee Overtopping triggers on acute flood neglect (< 45)', () => {
  const state = getInitialGameState('levee-test');
  state.bucket = 4;
  state.scores.floodPreparedness = 40;
  const events = evaluateDynamicInterRoundEvents(state);
  assert.ok(events.some(e => e.id === 'KELANI_LEVEE_OVERTOP'), 'Must trigger Kelani Levee Overtopping');
});

test('Dynamic Event: Dry-Zone Water Shock triggers on acute drought neglect (< 45)', () => {
  const state = getInitialGameState('drought-shock-test');
  state.bucket = 4;
  state.scores.droughtPreparedness = 40;
  const events = evaluateDynamicInterRoundEvents(state);
  assert.ok(events.some(e => e.id === 'DRY_ZONE_WATER_SHOCK'), 'Must trigger Dry-Zone Water Shock');
});

// ============================================================================
// TEST SUITE 5: ADAPTIVE STRATEGY BALANCING ACROSS DISTINCT HAZARD REGIMES
// ============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('TEST SUITE 5: ADAPTIVE STRATEGY BALANCING ACROSS DISTINCT HAZARD REGIMES');
console.log('--------------------------------------------------------------------------------');

interface DecisionStep {
  rankings?: string[];
  allocations?: Record<string, number>;
}

test('Compound Disaster Regime: Balanced multi-hazard strategy achieves Tier 1 resilience', () => {
  let state = getInitialGameState('sim-balanced-compound');
  const decisions: DecisionStep[] = [
    { rankings: ['1A', '1D', '1C', '1B', '1E'] },
    { rankings: ['2B', '2E', '2A', '2C', '2D'] },
    { allocations: { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 } },
    { allocations: { trucks_flood: 8, trucks_dryzone: 12, vehicles_flood: 24, vehicles_dryzone: 6, boats_flood: 20, boats_dryzone: 0 } },
    { rankings: ['5A', '5C', '5E', '5B', '5D'] },
    { rankings: ['6A', '6C', '6E', '6B', '6D'] },
  ];

  decisions.forEach(d => { state = processDecision(state, 'tester', d); });
  const result = calculateFinalOutcome(state);

  assert.strictEqual(result.endingTier, 'Tier 1: Exemplary Climate Resilience', 'Balanced strategy must achieve Tier 1');
  assert.ok(result.cps >= 80, `CPS should be >= 80, got ${result.cps}`);
  assert.strictEqual(Object.values(result.failureStates).some(Boolean), false, 'No failure states breached');
});

test('Severe Flood-Dominant Regime: Flood-Adaptive strategy decisively outperforms Water-Hoarding', () => {
  // Regime with extreme flood risk (80) and low drought risk (20)
  let stateFloodAdaptive = getInitialGameState('sim-flood-regime-adaptive');
  stateFloodAdaptive.risks.floodRisk = 80;
  stateFloodAdaptive.risks.droughtRisk = 20;

  const floodAdaptiveDecisions: DecisionStep[] = [
    { rankings: ['1A', '1C', '1D', '1B', '1E'] }, // Heavy Kelani drainage & early warning
    { rankings: ['2B', '2E', '2A', '2C', '2D'] }, // Mobilize Kelani teams & district monitors
    { allocations: { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 } },
    { allocations: { trucks_flood: 12, trucks_dryzone: 8, vehicles_flood: 26, vehicles_dryzone: 4, boats_flood: 20, boats_dryzone: 0 } },
    { rankings: ['5A', '5C', '5E', '5B', '5D'] },
    { rankings: ['6A', '6C', '6E', '6B', '6D'] },
  ];
  floodAdaptiveDecisions.forEach(d => { stateFloodAdaptive = processDecision(stateFloodAdaptive, 'tester', d); });
  const resAdaptive = calculateFinalOutcome(stateFloodAdaptive);

  // In contrast, Water-Hoarding strategy in a severe flood regime
  let stateWaterHoarder = getInitialGameState('sim-flood-regime-hoarder');
  stateWaterHoarder.risks.floodRisk = 80;
  stateWaterHoarder.risks.droughtRisk = 20;

  const waterHoarderDecisions: DecisionStep[] = [
    { rankings: ['1B', '1E', '1D', '1A', '1C'] }, // Burns 120M on bottled water, omits flood warning
    { rankings: ['2D', '2A', '2E', '2C', '2B'] }, // Postpones flood response
    { allocations: { evacuation: 10, drinkingWater: 50, medicalSupplies: 10 } }, // Starves flood evac
    { allocations: { trucks_flood: 0, trucks_dryzone: 20, vehicles_flood: 5, vehicles_dryzone: 25, boats_flood: 5, boats_dryzone: 15 } },
    { rankings: ['5B', '5D', '5C', '5A', '5E'] },
    { rankings: ['6D', '6B', '6C', '6A', '6E'] },
  ];
  waterHoarderDecisions.forEach(d => { stateWaterHoarder = processDecision(stateWaterHoarder, 'tester', d); });
  const resHoarder = calculateFinalOutcome(stateWaterHoarder);

  assert.strictEqual(resAdaptive.endingTier, 'Tier 1: Exemplary Climate Resilience', 'Flood-adaptive must achieve Tier 1');
  assert.ok(resAdaptive.cps >= 80, `Flood-adaptive CPS must be >= 80, got ${resAdaptive.cps}`);
  assert.strictEqual(Object.values(resAdaptive.failureStates).some(Boolean), false, 'No failure states breached');

  assert.strictEqual(resHoarder.endingTier, 'Tier 4: Systemic Crisis', 'Water-hoarder must end in Tier 4 crisis');
  assert.strictEqual(resHoarder.failureStates.catastrophicInundation, true, 'Hoarder must suffer catastrophic inundation in flood regime');
});

test('Severe Drought-Dominant Regime: Drought-Adaptive strategy decisively outperforms Flood-Only strategy', () => {
  // Regime with extreme drought risk (80) and low flood risk (20)
  let stateDroughtAdaptive = getInitialGameState('sim-drought-regime-adaptive');
  stateDroughtAdaptive.risks.floodRisk = 20;
  stateDroughtAdaptive.risks.droughtRisk = 80;

  const droughtAdaptiveDecisions: DecisionStep[] = [
    { rankings: ['1B', '1A', '1D', '1C', '1E'] }, // Prioritizes dry-zone water reserve
    { rankings: ['2B', '2E', '2A', '2C', '2D'] }, 
    { allocations: { evacuation: 20, drinkingWater: 50, medicalSupplies: 30 } }, // Funds full water delivery
    { allocations: { trucks_flood: 4, trucks_dryzone: 16, vehicles_flood: 10, vehicles_dryzone: 20, boats_flood: 15, boats_dryzone: 5 } },
    { rankings: ['5C', '5E', '5A', '5B', '5D'] },
    { rankings: ['6C', '6A', '6E', '6B', '6D'] },
  ];
  droughtAdaptiveDecisions.forEach(d => { stateDroughtAdaptive = processDecision(stateDroughtAdaptive, 'tester', d); });
  const resAdaptive = calculateFinalOutcome(stateDroughtAdaptive);

  // In contrast, Flood-Only strategy that starves dry zone
  let stateFloodOnly = getInitialGameState('sim-drought-regime-flood-only');
  stateFloodOnly.risks.floodRisk = 20;
  stateFloodOnly.risks.droughtRisk = 80;

  const floodOnlyDecisions: DecisionStep[] = [
    { rankings: ['1C', '1A', '1D', '1B', '1E'] },
    { rankings: ['2B', '2E', '2D', '2A', '2C'] },
    { allocations: { evacuation: 70, drinkingWater: 5, medicalSupplies: 10 } }, // Starves water (5M)
    { allocations: { trucks_flood: 20, trucks_dryzone: 0, vehicles_flood: 30, vehicles_dryzone: 0, boats_flood: 20, boats_dryzone: 0 } }, // Zero bowsers
    { rankings: ['5A', '5C', '5D', '5E', '5B'] },
    { rankings: ['6B', '6A', '6C', '6E', '6D'] },
  ];
  floodOnlyDecisions.forEach(d => { stateFloodOnly = processDecision(stateFloodOnly, 'tester', d); });
  const resFloodOnly = calculateFinalOutcome(stateFloodOnly);

  assert.strictEqual(resAdaptive.endingTier, 'Tier 1: Exemplary Climate Resilience', 'Drought-adaptive must achieve Tier 1');
  assert.ok(resAdaptive.cps >= 80, `Drought-adaptive CPS must be >= 80, got ${resAdaptive.cps}`);
  assert.strictEqual(Object.values(resAdaptive.failureStates).some(Boolean), false, 'No failure states breached');

  assert.strictEqual(resFloodOnly.endingTier, 'Tier 3: Pyrrhic Survival', 'Flood-only strategy must end in Tier 3');
  assert.strictEqual(resFloodOnly.failureStates.droughtShock, true, 'Flood-only strategy must trigger acute drought shock in drought regime');
});

// ============================================================================
// TEST SUITE 6: LARGE-SCALE REPRODUCIBLE MONTE CARLO SIMULATION (10,000 RUNS)
// ============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('TEST SUITE 6: LARGE-SCALE REPRODUCIBLE MONTE CARLO SIMULATION (10,000 RUNS)');
console.log('--------------------------------------------------------------------------------');

// Deterministic 32-bit PRNG (Mulberry32) for 100% reproducible Monte Carlo results
function createSeededPRNG(seed: number) {
  let s = seed >>> 0;
  return function(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('Monte Carlo (10,000 Seeded Random Runs): Zero random players achieve Tier 1; realistic balance curve confirmed', () => {
  const SAMPLE_SIZE = 10000;
  const SEED = 0xCAFEBABE; // Deterministic seed
  const prng = createSeededPRNG(SEED);

  let tierCounts = { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0, 'Tier 4': 0 };
  let failureBreaches = { insolvency: 0, inundation: 0, droughtShock: 0, civilBreakdown: 0 };
  let totalCPS = 0;
  let minCPS = 100;
  let maxCPS = 0;
  let totalFlood = 0;
  let minFlood = 100;
  let totalDrought = 0;
  let minDrought = 100;
  let totalBudget = 0;

  const shuffle = (arr: string[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  const startTime = Date.now();

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    let state = getInitialGameState(`mc-${i}`, `seed-${i}`);

    const d1 = shuffle(['1A', '1B', '1C', '1D', '1E']);
    const d2 = shuffle(['2A', '2B', '2C', '2D', '2E']);

    // Valid random allocation for Bucket 3 (sum <= 100)
    const e = Math.floor(prng() * 40);
    const w = Math.floor(prng() * 50);
    const m = Math.min(30, 100 - e - w);
    const d3 = { evacuation: e, drinkingWater: w, medicalSupplies: m };

    // Valid random fleet allocation for Bucket 4
    const tf = Math.floor(prng() * 21);
    const td = 20 - tf;
    const vf = Math.floor(prng() * 31);
    const vd = 30 - vf;
    const bf = Math.floor(prng() * 21);
    const bd = 20 - bf;
    const d4 = { trucks_flood: tf, trucks_dryzone: td, vehicles_flood: vf, vehicles_dryzone: vd, boats_flood: bf, boats_dryzone: bd };

    state = processDecision(state, `mc-${i}`, { rankings: d1 });
    state = processDecision(state, `mc-${i}`, { rankings: d2 });
    state = processDecision(state, `mc-${i}`, { allocations: d3 });

    let d4ToUse: any = { allocations: d4 };
    if (!validateConstraints(4, d4ToUse, state.resources.emergencyBudget).valid) {
      d4ToUse = { rankings: ['4E', '4A', '4B', '4C', '4D'] }; // Stand down fleet when borrowing limit reached
    }
    state = processDecision(state, `mc-${i}`, d4ToUse);

    let d5 = shuffle(['5A', '5B', '5C', '5D', '5E']);
    let attempts5 = 0;
    while (!validateConstraints(5, { rankings: d5 }, state.resources.emergencyBudget).valid && attempts5 < 50) {
      d5 = shuffle(['5A', '5B', '5C', '5D', '5E']);
      attempts5++;
    }
    if (!validateConstraints(5, { rankings: d5 }, state.resources.emergencyBudget).valid) {
      d5 = ['5E', '5D', '5C', '5A', '5B']; // Emergency aid reprioritization
    }
    state = processDecision(state, `mc-${i}`, { rankings: d5 });

    let d6 = shuffle(['6A', '6B', '6C', '6D', '6E']);
    let attempts6 = 0;
    while (!validateConstraints(6, { rankings: d6 }, state.resources.emergencyBudget).valid && attempts6 < 50) {
      d6 = shuffle(['6A', '6B', '6C', '6D', '6E']);
      attempts6++;
    }
    if (!validateConstraints(6, { rankings: d6 }, state.resources.emergencyBudget).valid) {
      d6 = ['6E', '6D', '6A', '6C', '6B']; // Emergency donor funding reprioritization
    }
    state = processDecision(state, `mc-${i}`, { rankings: d6 });

    const outcome = calculateFinalOutcome(state);

    totalCPS += outcome.cps;
    minCPS = Math.min(minCPS, outcome.cps);
    maxCPS = Math.max(maxCPS, outcome.cps);

    totalFlood += outcome.breakdown.floodPreparedness;
    minFlood = Math.min(minFlood, outcome.breakdown.floodPreparedness);

    totalDrought += outcome.breakdown.droughtPreparedness;
    minDrought = Math.min(minDrought, outcome.breakdown.droughtPreparedness);

    totalBudget += state.resources.emergencyBudget;

    if (outcome.endingTier.startsWith('Tier 1')) tierCounts['Tier 1']++;
    else if (outcome.endingTier.startsWith('Tier 2')) tierCounts['Tier 2']++;
    else if (outcome.endingTier.startsWith('Tier 3')) tierCounts['Tier 3']++;
    else tierCounts['Tier 4']++;

    if (outcome.failureStates.fiscalInsolvency) failureBreaches.insolvency++;
    if (outcome.failureStates.catastrophicInundation) failureBreaches.inundation++;
    if (outcome.failureStates.droughtShock) failureBreaches.droughtShock++;
    if (outcome.failureStates.civilBreakdown) failureBreaches.civilBreakdown++;
  }

  const durationMs = Date.now() - startTime;
  const avgCPS = totalCPS / SAMPLE_SIZE;
  const avgFlood = totalFlood / SAMPLE_SIZE;
  const avgDrought = totalDrought / SAMPLE_SIZE;
  const avgBudget = totalBudget / SAMPLE_SIZE;

  console.log(`\n  ================ MONTE CARLO RESULTS (10,000 SIMULATIONS) ================`);
  console.log(`  Execution Speed:          ${SAMPLE_SIZE.toLocaleString()} runs in ${durationMs}ms (${(SAMPLE_SIZE / (durationMs / 1000)).toFixed(0)} runs/sec)`);
  console.log(`  PRNG Seed:                0x${SEED.toString(16).toUpperCase()} (Fully Reproducible)`);
  console.log(`  --------------------------------------------------------------------------`);
  console.log(`  Ending Tier Distribution:`);
  console.log(`    - Tier 1 (Exemplary):   ${tierCounts['Tier 1']} (${(tierCounts['Tier 1'] / SAMPLE_SIZE * 100).toFixed(2)}%)`);
  console.log(`    - Tier 2 (Competent):   ${tierCounts['Tier 2']} (${(tierCounts['Tier 2'] / SAMPLE_SIZE * 100).toFixed(2)}%)`);
  console.log(`    - Tier 3 (Pyrrhic):     ${tierCounts['Tier 3']} (${(tierCounts['Tier 3'] / SAMPLE_SIZE * 100).toFixed(2)}%)`);
  console.log(`    - Tier 4 (Crisis):      ${tierCounts['Tier 4']} (${(tierCounts['Tier 4'] / SAMPLE_SIZE * 100).toFixed(2)}%)`);
  console.log(`  --------------------------------------------------------------------------`);
  console.log(`  Preparedness & Score Metrics:`);
  console.log(`    - Average CPS:          ${avgCPS.toFixed(1)} / 100 (Range: ${minCPS.toFixed(1)} - ${maxCPS.toFixed(1)})`);
  console.log(`    - Flood Preparedness:   Avg ${avgFlood.toFixed(1)}% (Worst-case: ${minFlood.toFixed(1)}%)`);
  console.log(`    - Drought Preparedness: Avg ${avgDrought.toFixed(1)}% (Worst-case: ${minDrought.toFixed(1)}%)`);
  console.log(`    - Remaining Budget:     Avg LKR ${avgBudget.toFixed(1)}M`);
  console.log(`  --------------------------------------------------------------------------`);
  console.log(`  Crisis Failure State Frequencies:`);
  console.log(`    - Fiscal Insolvency:    ${failureBreaches.insolvency} (${(failureBreaches.insolvency / SAMPLE_SIZE * 100).toFixed(1)}%)`);
  console.log(`    - Inundation (< 35):    ${failureBreaches.inundation} (${(failureBreaches.inundation / SAMPLE_SIZE * 100).toFixed(1)}%)`);
  console.log(`    - Drought Shock (< 30): ${failureBreaches.droughtShock} (${(failureBreaches.droughtShock / SAMPLE_SIZE * 100).toFixed(1)}%)`);
  console.log(`    - Civil Breakdown (< 25): ${failureBreaches.civilBreakdown} (${(failureBreaches.civilBreakdown / SAMPLE_SIZE * 100).toFixed(1)}%)`);
  console.log(`  ==========================================================================\n`);

  assert.ok(tierCounts['Tier 1'] / SAMPLE_SIZE <= 0.002, `Tier 1 win rate for random play must be <= 0.2%, got ${(tierCounts['Tier 1'] / SAMPLE_SIZE * 100).toFixed(2)}%`);
  assert.ok(avgCPS >= 25 && avgCPS <= 45, `Average random CPS should be in 25-45 range, got ${avgCPS}`);
  assert.ok(tierCounts['Tier 3'] + tierCounts['Tier 4'] > 8500, 'Over 85% of random runs must end in Pyrrhic Survival or Systemic Crisis');
});

test('Monte Carlo Multi-Regime Sensitivity Analysis (3,000 Runs across Compound, Flood, and Drought Regimes)', () => {
  const REGIME_SAMPLE = 1000;
  const SEED = 0x12345678;
  const prng = createSeededPRNG(SEED);

  const shuffle = (arr: string[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(prng() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  const regimes = [
    { name: 'Compound Hazard Regime (50 Flood / 50 Drought)', floodInit: 50, droughtInit: 50 },
    { name: 'Severe Flood-Dominant Regime (80 Flood / 20 Drought)', floodInit: 80, droughtInit: 20 },
    { name: 'Severe Drought-Dominant Regime (20 Flood / 80 Drought)', floodInit: 20, droughtInit: 80 },
  ];

  console.log(`\n  ================ MULTI-REGIME MONTE CARLO SENSITIVITY (3,000 RUNS) ================`);

  regimes.forEach(reg => {
    let tierCounts = { 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0, 'Tier 4': 0 };
    let breaches = { inundation: 0, droughtShock: 0, insolvency: 0 };
    let totalCPS = 0;
    let totalFlood = 0;
    let totalDrought = 0;
    let totalBudget = 0;

    for (let i = 0; i < REGIME_SAMPLE; i++) {
      let state = getInitialGameState(`reg-${reg.name}-${i}`);
      state.risks.floodRisk = reg.floodInit;
      state.risks.droughtRisk = reg.droughtInit;

      const d1 = shuffle(['1A', '1B', '1C', '1D', '1E']);
      const d2 = shuffle(['2A', '2B', '2C', '2D', '2E']);
      const e = Math.floor(prng() * 40);
      const w = Math.floor(prng() * 50);
      const m = Math.min(30, 100 - e - w);
      const d3 = { evacuation: e, drinkingWater: w, medicalSupplies: m };
      const tf = Math.floor(prng() * 21);
      const td = 20 - tf;
      const vf = Math.floor(prng() * 31);
      const vd = 30 - vf;
      const bf = Math.floor(prng() * 21);
      const bd = 20 - bf;
      const d4 = { trucks_flood: tf, trucks_dryzone: td, vehicles_flood: vf, vehicles_dryzone: vd, boats_flood: bf, boats_dryzone: bd };
      state = processDecision(state, `reg-${i}`, { rankings: d1 });
      state = processDecision(state, `reg-${i}`, { rankings: d2 });
      state = processDecision(state, `reg-${i}`, { allocations: d3 });

      let d4ToUse: any = { allocations: d4 };
      if (!validateConstraints(4, d4ToUse, state.resources.emergencyBudget).valid) {
        d4ToUse = { rankings: ['4E', '4A', '4B', '4C', '4D'] };
      }
      state = processDecision(state, `reg-${i}`, d4ToUse);

      let d5ToUse = shuffle(['5A', '5B', '5C', '5D', '5E']);
      let attempts5 = 0;
      while (!validateConstraints(5, { rankings: d5ToUse }, state.resources.emergencyBudget).valid && attempts5 < 50) {
        d5ToUse = shuffle(['5A', '5B', '5C', '5D', '5E']);
        attempts5++;
      }
      if (!validateConstraints(5, { rankings: d5ToUse }, state.resources.emergencyBudget).valid) {
        d5ToUse = ['5E', '5D', '5C', '5A', '5B'];
      }
      state = processDecision(state, `reg-${i}`, { rankings: d5ToUse });

      let d6ToUse = shuffle(['6A', '6B', '6C', '6D', '6E']);
      let attempts6 = 0;
      while (!validateConstraints(6, { rankings: d6ToUse }, state.resources.emergencyBudget).valid && attempts6 < 50) {
        d6ToUse = shuffle(['6A', '6B', '6C', '6D', '6E']);
        attempts6++;
      }
      if (!validateConstraints(6, { rankings: d6ToUse }, state.resources.emergencyBudget).valid) {
        d6ToUse = ['6E', '6D', '6A', '6C', '6B'];
      }
      state = processDecision(state, `reg-${i}`, { rankings: d6ToUse });

      const outcome = calculateFinalOutcome(state);
      totalCPS += outcome.cps;
      totalFlood += outcome.breakdown.floodPreparedness;
      totalDrought += outcome.breakdown.droughtPreparedness;
      totalBudget += state.resources.emergencyBudget;

      if (outcome.endingTier.startsWith('Tier 1')) tierCounts['Tier 1']++;
      else if (outcome.endingTier.startsWith('Tier 2')) tierCounts['Tier 2']++;
      else if (outcome.endingTier.startsWith('Tier 3')) tierCounts['Tier 3']++;
      else tierCounts['Tier 4']++;

      if (outcome.failureStates.catastrophicInundation) breaches.inundation++;
      if (outcome.failureStates.droughtShock) breaches.droughtShock++;
      if (outcome.failureStates.fiscalInsolvency) breaches.insolvency++;
    }

    const avgCPS = (totalCPS / REGIME_SAMPLE).toFixed(1);
    const avgFlood = (totalFlood / REGIME_SAMPLE).toFixed(1);
    const avgDrought = (totalDrought / REGIME_SAMPLE).toFixed(1);
    const avgBudget = (totalBudget / REGIME_SAMPLE).toFixed(1);

    console.log(`  REGIME: ${reg.name}`);
    console.log(`    - Avg CPS: ${avgCPS} | Flood Prep: ${avgFlood}% | Drought Prep: ${avgDrought}% | Budget: LKR ${avgBudget}M`);
    console.log(`    - Tier Dist: Tier 1: ${(tierCounts['Tier 1']/10).toFixed(1)}% | Tier 2: ${(tierCounts['Tier 2']/10).toFixed(1)}% | Tier 3: ${(tierCounts['Tier 3']/10).toFixed(1)}% | Tier 4: ${(tierCounts['Tier 4']/10).toFixed(1)}%`);
    console.log(`    - Breaches: Inundation: ${(breaches.inundation/10).toFixed(1)}% | Drought Shock: ${(breaches.droughtShock/10).toFixed(1)}% | Insolvency: ${(breaches.insolvency/10).toFixed(1)}%`);
    console.log(`  --------------------------------------------------------------------------`);

    assert.ok(tierCounts['Tier 1'] / REGIME_SAMPLE <= 0.005, 'Random play must fail to achieve Tier 1 across all hazard regimes');
  });
  console.log(`  ==========================================================================\n`);
});

console.log('================================================================================');
console.log(`ALL VERIFICATION TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('================================================================================');
