import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import Team from '../src/models/Team';
import User from '../src/models/User';
import GameSession from '../src/models/GameSession';
import assert from 'assert';

dotenv.config({ path: '.env' });

interface PlaytestSessionData {
  id: string;
  name: string;
  background: string;
  email: string;
  decisions: any[];
  expectedArchetype: string;
}

const PLAYTESTERS: PlaytestSessionData[] = [
  {
    id: 'PT1',
    name: 'Niroshan Bandara',
    background: 'Municipal Drainage & Civil Engineer (42)',
    email: 'tester1@sustaintech.online',
    expectedArchetype: 'Aggressive Infrastructure & Flood Defense Biased',
    decisions: [
      { bucket: 1, rankings: ['1C', '1A', '1D', '1E', '1B'] }, // 1C (-40M drainage), 1A (-10M inspect), 1D (-5M guidance): -55M -> 445M
      { bucket: 2, rankings: ['2C', '2B', '2E', '2A', '2D'] }, // 2C (-300M immediate spend), 2B (-8M forecasts), 2E (-20M monitoring): -328M -> 117M
      { bucket: 3, allocations: { evacuation: 45, drinkingWater: 25, medicalSupplies: 30 } }, // Allocation ceiling: -100M -> 17M
      { bucket: 4, allocations: { trucks_flood: 15, trucks_dryzone: 5, vehicles_flood: 24, vehicles_dryzone: 6, boats_flood: 20, boats_dryzone: 0 } }, // Fleet mobilization: -60M -> -43M (credit drawn)
      { bucket: 5, rankings: ['5A', '5C', '5E', '5B', '5D'] }, // 5A (-40M evac), 5C (-30M triage), 5E (+60M redirect funds): -10M -> -53M
      { bucket: 6, rankings: ['6B', '6A', '6E', '6C', '6D'] }, // 6B (-80M roads), 6A (-15M PDNA), 6E (+50M donor aid): -45M -> -98M
    ]
  },
  {
    id: 'PT2',
    name: 'Dr. Ananya Perera',
    background: 'Public Health Medical Officer (35)',
    email: 'tester2@sustaintech.online',
    expectedArchetype: 'Public Health, Safe Water & Civic Trust Prioritizer',
    decisions: [
      { bucket: 1, rankings: ['1A', '1D', '1C', '1B', '1E'] }, // 1A (-10M inspect), 1D (-5M guidance), 1C (-40M drainage): -55M -> 445M
      { bucket: 2, rankings: ['2E', '2B', '2A', '2D', '2C'] }, // 2E (-20M monitoring), 2B (-8M forecasts), 2A (-2M social media): -30M -> 415M
      { bucket: 3, allocations: { evacuation: 30, drinkingWater: 45, medicalSupplies: 25 } }, // Balanced human relief: -100M -> 315M
      { bucket: 4, allocations: { trucks_flood: 10, trucks_dryzone: 10, vehicles_flood: 18, vehicles_dryzone: 12, boats_flood: 15, boats_dryzone: 5 } }, // Fleet mobilization: -60M -> 255M
      { bucket: 5, rankings: ['5C', '5A', '5E', '5B', '5D'] }, // 5C (-30M triage), 5A (-40M evac), 5E (+60M redirect funds): -10M -> 245M
      { bucket: 6, rankings: ['6C', '6A', '6E', '6B', '6D'] }, // 6C (-50M disease/water), 6A (-15M PDNA), 6E (+50M donor aid): -15M -> 230M
    ]
  },
  {
    id: 'PT3',
    name: 'Kasun Jayawardena',
    background: 'Economics & Development Policy Student (23)',
    email: 'tester3@sustaintech.online',
    expectedArchetype: 'Extreme Fiscal Conservative / Austerity Risk',
    decisions: [
      { bucket: 1, rankings: ['1D', '1A', '1E', '1C', '1B'] }, // 1D (-5M guidance), 1A (-10M inspect), 1E (0M wait): -15M -> 485M
      { bucket: 2, rankings: ['2A', '2B', '2D', '2E', '2C'] }, // 2A (-2M social media), 2B (-8M forecasts), 2D (0M wait): -10M -> 475M
      { bucket: 3, allocations: { evacuation: 20, drinkingWater: 20, medicalSupplies: 15 } }, // Severe under-utilization: -55M -> 420M
      { bucket: 4, rankings: ['4E', '4A', '4B', '4C', '4D'] }, // 4E (0M hold fleet in reserve): 0M -> 420M
      { bucket: 5, rankings: ['5E', '5D', '5C', '5A', '5B'] }, // 5E (+60M redirect funds), 5D (0M volunteer evac), 5C (-30M triage): +30M -> 450M
      { bucket: 6, rankings: ['6E', '6D', '6A', '6C', '6B'] }, // 6E (+50M donor aid), 6D (0M rationing), 6A (-15M PDNA): +35M -> 485M
    ]
  },
  {
    id: 'PT4',
    name: 'Dr. Farhan Nizam',
    background: 'Disaster Relief Coordinator & General Practitioner (38)',
    email: 'tester4@sustaintech.online',
    expectedArchetype: 'Balanced Multi-Hazard Strategist',
    decisions: [
      { bucket: 1, rankings: ['1A', '1D', '1C', '1B', '1E'] }, // 1A (-10M inspect), 1D (-5M guidance), 1C (-40M drainage): -55M -> 445M
      { bucket: 2, rankings: ['2B', '2E', '2A', '2C', '2D'] }, // 2B (-8M forecasts), 2E (-20M monitoring), 2A (-2M social media): -30M -> 415M
      { bucket: 3, rankings: ['3A', '3D', '3C', '3B', '3E'] }, // Plan 3A: 40 evac, 30 water, 30 med (-100M) -> 315M
      { bucket: 4, rankings: ['4A', '4B', '4C', '4D', '4E'] }, // Plan 4A: balanced national deployment (-60M fee) -> 255M
      { bucket: 5, rankings: ['5A', '5C', '5E', '5B', '5D'] }, // 5A (-40M evac), 5C (-30M triage), 5E (+60M redirect funds): -10M -> 245M
      { bucket: 6, rankings: ['6A', '6C', '6E', '6B', '6D'] }, // 6A (-15M PDNA), 6C (-50M disease/water), 6E (+50M donor aid): -15M -> 230M
    ]
  },
  {
    id: 'PT5',
    name: 'Dilani Samarasinghe',
    background: 'First-time Non-Technical Player (29)',
    email: 'tester5@sustaintech.online',
    expectedArchetype: 'Intuitive / Reactive Crisis Manager',
    decisions: [
      { bucket: 1, rankings: ['1B', '1C', '1A', '1D', '1E'] }, // 1B (-120M bottled water), 1C (-40M drainage), 1A (-10M inspect): -170M -> 330M
      { bucket: 2, rankings: ['2C', '2A', '2B', '2E', '2D'] }, // 2C (-300M immediate spend), 2A (-2M social media), 2B (-8M forecasts): -310M -> 20M
      { bucket: 3, allocations: { evacuation: 40, drinkingWater: 30, medicalSupplies: 30 } }, // Allocation ceiling: -100M -> -80M (credit drawn)
      { bucket: 4, rankings: ['4A', '4B', '4C', '4D', '4E'] }, // Plan 4A: fleet mobilization fee (-60M) -> -140M (credit drawn)
      { bucket: 5, rankings: ['5A', '5C', '5E', '5B', '5D'] }, // 5A (-40M evac), 5C (-30M triage), 5E (+60M redirect funds): -10M -> -150M
      { bucket: 6, rankings: ['6A', '6E', '6C', '6B', '6D'] }, // 6A (-15M PDNA), 6E (+50M donor aid), 6C (-50M disease/water): -15M -> -165M
    ]
  }
];

async function setupAndRunPlaytests() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not found in .env');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  console.log('\n================================================================================');
  console.log('STAGE 1: TECHNICAL SMOKE TEST (REPLAYING KNOWN 6-ROUND REFERENCE RUN)');
  console.log('================================================================================\n');

  // Verify technical smoke test for Team 1
  const smokeLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'team1@sustaintech.online', password: 'Team1@systain' })
  });
  assert.strictEqual(smokeLoginRes.status, 200);
  const smokeCookie = smokeLoginRes.headers.get('set-cookie')?.split(';')[0];
  assert.ok(smokeCookie);

  // Checkpoint 0
  const c0Res = await fetch('http://localhost:3000/api/game/state', { headers: { Cookie: smokeCookie } });
  const c0Data = await c0Res.json();
  const c0State = c0Data.gameSession.state;
  console.log(`[Smoke Test] Day 0 Starting Budget: LKR ${c0State.resources.emergencyBudget}M (Expected: 500M)`);
  assert.strictEqual(c0State.resources.emergencyBudget, 500);

  // Checkpoint 1 (Day 2)
  const c1Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['1D', '1A', '1C', '1B', '1E'] })
  });
  const c1State = (await c1Res.json()).gameSession.state;
  console.log(`[Smoke Test] Day 2 Post-Ops Budget: LKR ${c1State.resources.emergencyBudget}M (Expected: 445M)`);
  assert.strictEqual(c1State.resources.emergencyBudget, 445);

  // Checkpoint 2 (Day 4)
  const c2Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['2B', '2E', '2C', '2A', '2D'] })
  });
  const c2State = (await c2Res.json()).gameSession.state;
  console.log(`[Smoke Test] Day 4 Post-Hazard Budget: LKR ${c2State.resources.emergencyBudget}M (Expected: 117M)`);
  assert.strictEqual(c2State.resources.emergencyBudget, 117);

  // Checkpoint 3 (Day 4 Allocation 3A)
  const c3Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['3A', '3D', '3C', '3B', '3E'] })
  });
  const c3State = (await c3Res.json()).gameSession.state;
  console.log(`[Smoke Test] Day 4 Post-Alloc Budget: LKR ${c3State.resources.emergencyBudget}M (Expected: 17M)`);
  assert.strictEqual(c3State.resources.emergencyBudget, 17);

  // Checkpoint 4 (Day 6 Fleet 4A)
  const c4Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['4A', '4B', '4C', '4D', '4E'] })
  });
  const c4State = (await c4Res.json()).gameSession.state;
  console.log(`[Smoke Test] Day 6 Fleet Budget: LKR ${c4State.resources.emergencyBudget}M (Expected: -43M, 157M facility avail)`);
  assert.strictEqual(c4State.resources.emergencyBudget, -43);

  // Checkpoint 5 (Day 8 Ops & Funding)
  const c5Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['5A', '5C', '5E', '5B', '5D'] })
  });
  const c5State = (await c5Res.json()).gameSession.state;
  console.log(`[Smoke Test] Day 8 Ops & Aid Budget: LKR ${c5State.resources.emergencyBudget}M (Expected: -53M)`);
  assert.strictEqual(c5State.resources.emergencyBudget, -53);

  // Checkpoint 6 (Day 10 Recovery & Donor Matching)
  const c6Res = await fetch('http://localhost:3000/api/game/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: smokeCookie },
    body: JSON.stringify({ rankings: ['6A', '6C', '6E', '6B', '6D'] })
  });
  const c6Data = await c6Res.json();
  const c6State = c6Data.gameSession.state;
  const c6Result = c6Data.gameSession.finalResult;
  console.log(`[Smoke Test] Day 10 Final Treasury: LKR ${c6State.resources.emergencyBudget}M (Expected: -68M, 132M facility avail)`);
  assert.strictEqual(c6State.resources.emergencyBudget, -68);
  console.log(`[Smoke Test] Final Score: CPS ${c6Result.cps} | Ending: ${c6Result.endingTier}`);
  assert.strictEqual(c6Result.endingTier, 'Tier 3: Pyrrhic Survival');
  assert.strictEqual(c6Result.failureStates.fiscalInsolvency, true);
  console.log('✓ TECHNICAL SMOKE TEST COMPLETED: ALL 6 CHECKPOINTS FULLY RECONCILED\n');

  console.log('================================================================================');
  console.log('STAGE 2: PROVISIONING 5 ISOLATED SIMULATED-PERSONA SESSIONS (PRE-FLIGHT)');
  console.log('================================================================================\n');

  const sessionResults: any[] = [];

  for (const pt of PLAYTESTERS) {
    // 1. Ensure Team Exists
    let team = await Team.findOne({ name: `Team ${pt.name}` });
    if (!team) {
      team = await Team.create({ name: `Team ${pt.name}` });
    }

    // 2. Ensure User Exists
    let user = await User.findOne({ email: pt.email });
    if (!user) {
      const passwordHash = await bcrypt.hash('playtest2026!', 10);
      user = await User.create({
        email: pt.email,
        name: pt.name,
        passwordHash,
        role: 'player',
        teamId: team._id
      });
      console.log(`Created User: ${pt.name} (${pt.email})`);
    }

    // 3. Reset existing session for isolated run
    await GameSession.deleteMany({ teamId: team._id });

    // 4. Authenticate Playtester
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pt.email, password: 'playtest2026!' })
    });
    assert.strictEqual(loginRes.status, 200, `Login failed for ${pt.name}`);
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    assert.ok(cookie);

    // 5. Initialize clean Day 0 State
    const initRes = await fetch('http://localhost:3000/api/game/state', { headers: { Cookie: cookie } });
    const initData = await initRes.json();
    const initState = initData.gameSession.state;
    assert.strictEqual(initState.resources.emergencyBudget, 500);

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`PLAYTEST SESSION ${pt.id}: ${pt.name}`);
    console.log(`Background: ${pt.background}`);
    console.log(`Profile:    ${pt.expectedArchetype}`);
    console.log(`Starting:   Day ${initState.day} | Treasury LKR ${initState.resources.emergencyBudget}M`);
    console.log(`--------------------------------------------------------------------------------`);

    const roundLedger: any[] = [{ day: 0, budget: 500, label: 'Day 0 Starting' }];
    let lastState = initState;
    let finalOutcome: any = null;

    // 6. Step through all 6 decisions
    for (let roundIdx = 0; roundIdx < pt.decisions.length; roundIdx++) {
      const dec = pt.decisions[roundIdx];
      const decRes: Response = await fetch('http://localhost:3000/api/game/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify(dec)
      });
      assert.strictEqual(decRes.status, 200, `Decision submission failed on Round ${roundIdx + 1} for ${pt.name}`);
      const decData = await decRes.json();
      lastState = decData.gameSession.state;
      if (decData.gameSession.finalResult) {
        finalOutcome = decData.gameSession.finalResult;
      }

      roundLedger.push({
        bucket: lastState.bucket - 1,
        day: lastState.day,
        budget: lastState.resources.emergencyBudget,
        flood: Math.round(lastState.scores.floodPreparedness),
        drought: Math.round(lastState.scores.droughtPreparedness),
        trust: Math.round(lastState.community.communityTrust),
        intel: Math.round(lastState.information.informationQuality)
      });

      console.log(`  Round ${roundIdx + 1} (Day ${lastState.day}): Budget = LKR ${lastState.resources.emergencyBudget}M | Flood = ${Math.round(lastState.scores.floodPreparedness)}% | Drought = ${Math.round(lastState.scores.droughtPreparedness)}% | Trust = ${Math.round(lastState.community.communityTrust)}%`);
    }

    sessionResults.push({
      playtester: pt,
      ledger: roundLedger,
      outcome: finalOutcome,
      finalState: lastState
    });

    console.log(`  >>> Final Result: CPS ${finalOutcome.cps} | Ending: ${finalOutcome.endingTier}`);
    console.log(`  >>> Failures Breached:`, Object.entries(finalOutcome.failureStates).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None (Solvent & Resilient)');
    console.log(`  >>> Summary: "${finalOutcome.summary}"\n`);
  }

  await mongoose.disconnect();
  return sessionResults;
}

setupAndRunPlaytests().catch(err => {
  console.error('PLAYTEST HARNESS FAILED:', err);
  process.exit(1);
});
