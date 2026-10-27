export interface PracticeOption {
  id: string; // 'A' | 'B' | 'C' | 'D' | 'E'
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  title: string;
  category: string;
  tagline: string;
  description: string;
  pros: string;
  cons: string;
  isSuggested?: boolean;
}

export interface PracticeRankScenario {
  type: 'rank';
  id: 1 | 3;
  scenarioNumber: 1 | 3;
  title: string;
  scenarioSubtitle: string;
  situation: string;
  options: PracticeOption[];
  suggestedAnswerId: string;
  suggestedAnswerSummary: string;
  suggestedAnswerExplanation: string;
}

export interface PracticePresetPlan {
  id: string; // '2A', '2B', etc.
  title: string;
  tagline: string;
  description: string;
  allocations: {
    relocationStalls: number;
    phasedConstruction: number;
    livelihoodSupport: number;
  };
  totalCost: number;
  isOverLimit?: boolean;
  pros: string;
  cons: string;
}

export interface PracticeAllocationSector {
  key: 'relocationStalls' | 'phasedConstruction' | 'livelihoodSupport';
  label: string;
  maxLimit: number;
  recommendedMin: number;
  unit: string;
  impactSummary: string;
  riskIfUnderfunded: string;
}

export interface PracticeAllocationScenario {
  type: 'allocate';
  id: 2;
  scenarioNumber: 2;
  title: string;
  scenarioSubtitle: string;
  situation: string;
  totalBudgetCap: number; // 100M
  presetPlans: PracticePresetPlan[];
  sectors: PracticeAllocationSector[];
  suggestedPlanId: string;
  suggestedAnswerSummary: string;
  suggestedAnswerExplanation: string;
}

export type AnyPracticeScenario = PracticeRankScenario | PracticeAllocationScenario;

// =============================================================================
// SCENARIO 1: Bus Network Redesign (5 Options, Prioritize 1 - 5, Top 3 Taken)
// =============================================================================
export const PRACTICE_SCENARIO_1: PracticeRankScenario = {
  type: 'rank',
  id: 1,
  scenarioNumber: 1,
  title: "Scenario 1: Bus Network Redesign",
  scenarioSubtitle: "Ridership Decline • Fleet Bunching • Reliability vs Fleet Expansion",
  situation: `You head the planning unit of a regional transport authority. Ridership on your busiest route has dropped 18% in two years because buses are unreliable: they bunch together, and wait times swing between 5 and 40 minutes. Your budget allows only one major intervention this year.

Prioritize all 5 options in order of strategic value (Rank 1 to 5). Due to resource constraints, ONLY THE FIRST 3 ACTIONS will be executed.`,
  suggestedAnswerId: 'B',
  suggestedAnswerSummary: "Introduce GPS tracking and real-time arrival info, plus timetable-based dispatching to space out buses.",
  suggestedAnswerExplanation: "The root problem is reliability, not comfort or price. Spacing buses properly and giving passengers real-time information fixes the bunching and the unpredictable waits at a fraction of the cost of new vehicles. New buses (A) would still bunch, a fare cut (C) reduces revenue without fixing the service, and new routes (D) spread an unreliable system thinner.",
  options: [
    {
      id: 'A',
      letter: 'A',
      title: "Buy 20 New Air-Conditioned Buses",
      category: "Fleet Procurement",
      tagline: "Modernize rolling stock to enhance commuter comfort",
      description: "Procure and commission 20 new air-conditioned buses to make the public transit service noticeably more attractive to commuters.",
      pros: "Improves passenger comfort, climate control, and visual fleet appeal.",
      cons: "High capital expense; new buses still bunch together without dispatching, leaving erratic wait times unresolved.",
      isSuggested: false
    },
    {
      id: 'B',
      letter: 'B',
      title: "Introduce GPS Tracking, Real-Time Arrival Info & Timetable Dispatching",
      category: "Operational Intelligence",
      tagline: "Eliminate bunching through dynamic telemetry and spaced dispatch",
      description: "Introduce GPS vehicle tracking, live arrival displays at stops and mobile apps, combined with timetable-based dispatching to evenly space out buses.",
      pros: "Targets the root problem of reliability and 5–40 min unpredictable waits at a fraction of the cost of new vehicles.",
      cons: "Requires driver compliance and operational dispatch monitoring.",
      isSuggested: true
    },
    {
      id: 'C',
      letter: 'C',
      title: "Cut Transit Fares by 25%",
      category: "Tariff & Pricing",
      tagline: "Discount ticket prices across the corridor to stimulate ridership",
      description: "Implement an across-the-board 25% fare reduction to win passengers back to the public bus network.",
      pros: "Lowers commuter expense and creates immediate promotional interest.",
      cons: "Severely reduces operating revenues without fixing the service; riders left due to unreliability, not price.",
      isSuggested: false
    },
    {
      id: 'D',
      letter: 'D',
      title: "Add Three New Routes to Cover More Areas",
      category: "Network Expansion",
      tagline: "Extend geographical coverage into underserved outer neighborhoods",
      description: "Add three new feeder and branch routes to expand the transit network into newly developed suburban areas.",
      pros: "Expands geographic footprint to communities currently lacking bus access.",
      cons: "Spreads an already unreliable fleet and driver pool thinner, compounding delays across the entire network.",
      isSuggested: false
    },
    {
      id: 'E',
      letter: 'E',
      title: "Dedicated Peak-Hour Bus Lanes & Transit Signal Priority",
      category: "Corridor Infrastructure",
      tagline: "Bypass traffic congestion at critical intersection bottlenecks",
      description: "Designate curbside peak-hour bus-only lanes and configure traffic signal priority at the corridor's 8 busiest bottleneck intersections.",
      pros: "Shields transit from general traffic congestion and stabilizes travel times alongside spaced dispatching.",
      cons: "Requires municipal traffic police coordination and minor road re-striping.",
      isSuggested: true
    }
  ]
};

// =============================================================================
// SCENARIO 2: Light Rail Project & Community Opposition (Multi-Sector Allocation)
// =============================================================================
export const PRACTICE_SCENARIO_2: PracticeAllocationScenario = {
  type: 'allocate',
  id: 2,
  scenarioNumber: 2,
  title: "Scenario 2: Light Rail Project & Community Opposition",
  scenarioSubtitle: "Transit Alignment • 300 Market Traders • LKR 100M Emergency Budget Allocation",
  situation: `A new light rail line is approved, but the best alignment runs through a busy market district. About 300 small traders would lose their stalls during the 18-month construction period. They oppose the project, and a protest is planned next week. An alternative route avoids the market but adds 4 km, costs 22% more, and serves fewer commuters.

To keep the optimal alignment while addressing the traders' real concern (loss of livelihood during construction), the City Cabinet has allocated an Emergency Mitigation Fund of exactly LKR 100 Million. Total identified sectoral needs equal LKR 120 Million:
• Sector A: Temporary Relocation Sites & Serviced Stalls (Needs LKR 40M)
• Sector B: Phased Sectional Construction & Accelerated Track Laying (Needs LKR 50M)
• Sector C: Direct Transition Support & Livelihood Protection Grants (Needs LKR 30M)

You must allocate the LKR 100M fund across these three sectors. Choose a Prebuilt Plan or use Custom Allocation. Overspending beyond 100M is prohibited by Treasury rules.`,
  totalBudgetCap: 100,
  suggestedPlanId: '2A',
  suggestedAnswerSummary: "Keep original route with trader consultation, phased construction in sections, temporary relocation sites, and guaranteed return rights.",
  suggestedAnswerExplanation: "It keeps the route that serves the most commuters while addressing the traders' real concern, which is loss of livelihood during construction. Phasing and temporary relocation reduce the harm, and early consultation builds trust. Cash alone (A) rarely replaces a lost customer base, the alternative route (B) is costlier and less effective, and open-ended delay (D) gives traders a veto and stalls the project.",
  presetPlans: [
    {
      id: "2A",
      title: "Plan 2A: Balanced Alignment & Trader Shield",
      tagline: "Stalls 40M / Phased Works 35M / Livelihood 25M",
      description: "Equitably distributes the 100M grant: fully funds serviced interim stalls nearby (40M), sustains phased sectional civil works (35M), and provides transition grants (25M).",
      allocations: { relocationStalls: 40, phasedConstruction: 35, livelihoodSupport: 25 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Protects traders' livelihoods, keeps the best transit alignment, and builds genuine community trust.",
      cons: "Requires active multi-agency project management across civil and merchant liaison teams."
    },
    {
      id: "2B",
      title: "Plan 2B: Rapid Construction Acceleration",
      tagline: "Stalls 20M / Phased Works 50M / Livelihood 30M",
      description: "Directs maximum funding (50M) to round-the-clock rail construction to compress the 18-month timeline to 11 months, with 20M for basic stalls and 30M for transition stipends.",
      allocations: { relocationStalls: 20, phasedConstruction: 50, livelihoodSupport: 30 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Dramatically shortens disruption duration and brings light rail into revenue service earlier.",
      cons: "Interim relocation stalls operate at basic capacity with limited customer amenities."
    },
    {
      id: "2C",
      title: "Plan 2C: Comprehensive Stall Infrastructure",
      tagline: "Stalls 50M / Phased Works 25M / Livelihood 25M",
      description: "Allocates maximum allowable funds (50M) to construct premium weather-protected market plazas with customer parking, allocating 25M to civil phasing and 25M to stipends.",
      allocations: { relocationStalls: 50, phasedConstruction: 25, livelihoodSupport: 25 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Guarantees zero commercial drop-off for market traders; fully embraces community partnership.",
      cons: "Construction phasing operates with tighter margins, risking schedule slippage."
    },
    {
      id: "2D",
      title: "Plan 2D: Direct Cash Compensation Focus",
      tagline: "Stalls 20M / Phased Works 30M / Livelihood 50M",
      description: "Provides maximum direct cash payouts (50M) to stallholders, allocating 20M for basic relocation lots and 30M for construction phasing.",
      allocations: { relocationStalls: 20, phasedConstruction: 30, livelihoodSupport: 50 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Immediate cash liquidity in merchants' pockets, defusing protest tension next week.",
      cons: "Cash alone rarely replaces a displaced customer base long-term; weaker temporary infrastructure."
    },
    {
      id: "2E",
      title: "Plan 2E: Statutory Overdraft Plan (Over Cap)",
      tagline: "Stalls 50M / Phased Works 40M / Livelihood 30M = 120M (INVALID)",
      description: "Attempts to fund all identified requirements in full (120M), breaching the statutory LKR 100M round limit set by the City Cabinet.",
      allocations: { relocationStalls: 50, phasedConstruction: 40, livelihoodSupport: 30 },
      totalCost: 120,
      isOverLimit: true,
      pros: "Fully funds every demand on paper.",
      cons: "Strictly rejected by Treasury audit controllers; incurs severe governance penalties."
    }
  ],
  sectors: [
    {
      key: 'relocationStalls',
      label: 'Sector A: Temporary Relocation Sites & Serviced Stalls',
      maxLimit: 50,
      recommendedMin: 35,
      unit: 'M LKR',
      impactSummary: 'Leases adjacent land, sets up weather-proof retail stalls with electricity, water, and customer walkway signage for 300 merchants.',
      riskIfUnderfunded: 'Underfunding below 35M LKR leaves merchants in squalid temporary lots, causing customer boycott and renewed street demonstrations.'
    },
    {
      key: 'phasedConstruction',
      label: 'Sector B: Phased Sectional Construction & Civil Works',
      maxLimit: 50,
      recommendedMin: 30,
      unit: 'M LKR',
      impactSummary: 'Deploys localized acoustic barriers, micro-trenching, and sectional block closures to keep pedestrian access open to market aisles.',
      riskIfUnderfunded: 'Underfunding below 30M LKR halts sectional phasing, forcing a complete 18-month corridor shutdown and legal contractor delays.'
    },
    {
      key: 'livelihoodSupport',
      label: 'Sector C: Trader Transition Grants & Livelihood Protection',
      maxLimit: 50,
      recommendedMin: 20,
      unit: 'M LKR',
      impactSummary: 'Provides bridge stipends, transport vouchers, and guaranteed tenancy agreements ensuring all 300 vendors return to new light rail concourses.',
      riskIfUnderfunded: 'Underfunding below 20M LKR triggers acute household hardship among vulnerable stallholders, provoking unified merchant strikes.'
    }
  ]
};

// =============================================================================
// SCENARIO 3: Electronic Ticketing Rollout (5 Options, Prioritize 1 - 5, Top 3 Taken)
// =============================================================================
export const PRACTICE_SCENARIO_3: PracticeRankScenario = {
  type: 'rank',
  id: 3,
  scenarioNumber: 3,
  title: "Scenario 3: Pilot or Full Rollout of Electronic Ticketing",
  scenarioSubtitle: "Smart Card Cutover • 400 Buses & 3 Rail Lines • Digital Equity & Scalability",
  situation: `Your city wants to replace cash fares with a tap-and-go smart card across 400 buses and 3 train lines. A vendor offers a quick, citywide launch within 3 months. Your technical team warns that many older passengers and daily-wage commuters have no bank accounts or smartphones, and that the system has never been tested at your scale.

Prioritize all 5 options in order of strategic value (Rank 1 to 5). Due to resource constraints, ONLY THE FIRST 3 ACTIONS will be executed.`,
  suggestedAnswerId: 'C',
  suggestedAnswerSummary: "Pilot on two routes for 3 months with cash option, collect data on failures and passenger feedback, then expand in stages.",
  suggestedAnswerExplanation: "A pilot exposes technical faults and usability problems while the cost of failure is small, and keeping cash protects passengers who can't switch yet. Staged expansion lets you fix issues before they affect the whole network. Forcing adoption (A) excludes vulnerable groups, B risks a large-scale failure with an untested system, and D abandons a useful improvement instead of managing its risks.",
  options: [
    {
      id: 'A',
      letter: 'A',
      title: "Launch Citywide in 3 Months & Remove Cash Entirely",
      category: "Mandatory Cutover",
      tagline: "Enforce universal digital ticketing immediately to force adoption",
      description: "Execute a rapid full-system rollout in 3 months and ban cash transactions on day one, forcing all passengers onto smart cards.",
      pros: "Rapid project realization and instantaneous elimination of cash-handling leakage.",
      cons: "Excludes vulnerable unbanked commuters and seniors; severe risk of widespread network failure and fare evasion.",
      isSuggested: false
    },
    {
      id: 'B',
      letter: 'B',
      title: "Launch Citywide Immediately but Keep Cash for 6 Months",
      category: "Full Deployment with Fallback",
      tagline: "Deploy across 400 buses and 3 train lines with temporary cash grace period",
      description: "Equip all 400 buses and 3 train lines with smart card readers simultaneously within 3 months, keeping cash as a fallback for 6 months before reassessing.",
      pros: "Buffers non-digital riders while providing full hardware availability everywhere.",
      cons: "High risk of large-scale systemic failure with an untested system across 400 buses and 3 rail corridors.",
      isSuggested: false
    },
    {
      id: 'C',
      letter: 'C',
      title: "Pilot on Two Routes for 3 Months with Cash Option, Then Expand in Stages",
      category: "Staged Pilot Validation",
      tagline: "Expose technical faults when cost of failure is small, protecting cash users",
      description: "Pilot on two busy routes for 3 months, keep cash as an option, collect data on technical failures and passenger feedback, then expand across the network in stages.",
      pros: "Exposes bugs and usability problems at low failure cost; staged expansion allows fixing issues before they affect the whole network.",
      cons: "Takes longer to achieve full citywide electronic fare modernization.",
      isSuggested: true
    },
    {
      id: 'D',
      letter: 'D',
      title: "Cancel the Project Because Some Passengers Can't Use It",
      category: "Project Abandonment",
      tagline: "Shelve smart ticketing to avoid equity and technical complications",
      description: "Abort the electronic smart card project entirely to maintain status-quo cash fare collection and avoid digital exclusion.",
      pros: "Avoids procurement expenses and zero disruption to daily-wage cash commuters.",
      cons: "Abandons a useful network modernization instead of managing and mitigating its risks.",
      isSuggested: false
    },
    {
      id: 'E',
      letter: 'E',
      title: "Cash-to-Card Kiosks & Assisted Mobile Top-Up at Terminals",
      category: "Digital Inclusivity",
      tagline: "Equip major transit interchanges with assisted cash deposit terminals",
      description: "Install simple cash-accepting smart card dispensing kiosks at all primary bus stations and deploy trained youth navigators to assist unbanked and senior passengers.",
      pros: "Bridges the digital divide, allowing unbanked commuters to convert physical coins/notes into smart cards without a bank account.",
      cons: "Adds modest equipment and staffing overhead at primary transit terminals.",
      isSuggested: true
    }
  ]
};

export const PRACTICE_SCENARIOS = [
  PRACTICE_SCENARIO_1,
  PRACTICE_SCENARIO_2,
  PRACTICE_SCENARIO_3
];

// =============================================================================
// EVALUATION LOGIC
// =============================================================================
export interface ScenarioAudit {
  scenarioNumber: 1 | 2 | 3;
  scenarioTitle: string;
  userSummary: string;
  suggestedAnswerId: string;
  suggestedAnswerSummary: string;
  suggestedAnswerExplanation: string;
  isOptimal: boolean;
  score: number; // out of 33 or 34
  maxScore: number;
  feedback: string;
}

export interface PracticeEvaluationResult {
  score: number; // 0 - 100
  tier: 'Tier 1: Master Urban Planner' | 'Tier 2: Strategic Transit Analyst' | 'Tier 3: Developing Policy Maker' | 'Tier 4: Tactical Misalignment';
  tierColor: string;
  summary: string;
  correctCount: number;
  pillars: {
    name: string;
    score: number; // 0 - 100
    description: string;
  }[];
  scenarioAudits: {
    scenario1: ScenarioAudit;
    scenario2: ScenarioAudit;
    scenario3: ScenarioAudit;
  };
  keyTakeaways: string[];
}

export function evaluatePracticeGame(
  scenario1Rankings: string[],
  scenario2Data: {
    mode: 'preset' | 'custom';
    presetPlan: string | null;
    allocations: { relocationStalls: number; phasedConstruction: number; livelihoodSupport: number };
  },
  scenario3Rankings: string[]
): PracticeEvaluationResult {
  // ---------------------------------------------------------------------------
  // Scenario 1 Evaluation: First 3 actions get executed
  // ---------------------------------------------------------------------------
  const s1Selected = scenario1Rankings.slice(0, 3);
  let s1Score = 0;
  let s1Feedback = '';

  const s1HasB = s1Selected.includes('B');
  const s1HasE = s1Selected.includes('E');
  const s1Rank1IsB = scenario1Rankings[0] === 'B';

  if (s1HasB) s1Score += 18;
  if (s1HasE) s1Score += 10;
  if (s1Rank1IsB) s1Score += 5; // Top priority placement bonus
  if (s1Selected.includes('A') && !s1HasE) s1Score += 5;
  if (s1Selected.includes('C') && !s1HasB) s1Score += 4;
  if (s1Selected.includes('D')) s1Score += 2;

  s1Score = Math.min(33, Math.max(8, s1Score));

  if (s1HasB && s1HasE) {
    s1Feedback = "Exemplary Strategic Synergy: Prioritizing GPS telemetry & headway dispatching (B) combined with dedicated bus lanes (E) directly eliminates bus bunching and speeds up corridors without fleet overspending.";
  } else if (s1HasB) {
    s1Feedback = "Strong Root-Cause Focus: GPS tracking and headway dispatching (B) fixes the bunching and the unpredictable wait times at a fraction of the cost of buying new vehicles.";
  } else if (s1Selected.includes('A')) {
    s1Feedback = "Capital-Heavy Comfort Focus: Buying new air-conditioned buses (A) improves passenger comfort, but without timetable-based dispatching, the new buses still bunch together, leaving erratic 5–40 minute waits.";
  } else {
    s1Feedback = "Misaligned Interventions: Fare cuts (C) bleed operating revenue without fixing delays, while adding new routes (D) spreads an already unreliable fleet even thinner.";
  }

  // ---------------------------------------------------------------------------
  // Scenario 2 Evaluation: Resource Allocation (100M Cap against 120M needs)
  // ---------------------------------------------------------------------------
  const { relocationStalls, phasedConstruction, livelihoodSupport } = scenario2Data.allocations;
  const s2Total = relocationStalls + phasedConstruction + livelihoodSupport;
  let s2Score = 0;
  let s2Feedback = '';

  if (s2Total > 100 || scenario2Data.presetPlan === '2E') {
    s2Score = 8;
    s2Feedback = `Budget Breach Deficit: Allocated LKR ${s2Total}M, exceeding the statutory 100M grant limit. The plan was rejected by treasury audit controllers for fiscal overdraft.`;
  } else if (s2Total < 65) {
    s2Score = 14;
    s2Feedback = `Under-Investment: Allocated only LKR ${s2Total}M of the 100M grant during an active crisis, leaving critical market relocation and civil engineering underfunded.`;
  } else {
    let base = 20;
    if (relocationStalls >= 35) base += 5;
    else if (relocationStalls >= 20) base += 2;

    if (phasedConstruction >= 30) base += 4;
    else if (phasedConstruction >= 20) base += 2;

    if (livelihoodSupport >= 20) base += 4;
    else if (livelihoodSupport >= 10) base += 2;

    s2Score = Math.min(33, base);

    if (relocationStalls >= 35 && phasedConstruction >= 30 && livelihoodSupport >= 20) {
      s2Feedback = "Optimal Alignment & Mitigation: Balanced investment across serviced interim stalls, phased construction sections, and livelihood support keeps the best commuter route while building trust with the 300 market traders.";
    } else if (relocationStalls < 30) {
      s2Feedback = "Relocation Vulnerability: Temporary vendor stalls were underfunded, risking severe merchant hardship and street protests.";
    } else {
      s2Feedback = "Functional Distribution: Successfully respected the 100M cap and supported baseline operations, though trade-offs constrained civil phasing speed.";
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario 3 Evaluation: First 3 actions get executed
  // ---------------------------------------------------------------------------
  const s3Selected = scenario3Rankings.slice(0, 3);
  let s3Score = 0;
  let s3Feedback = '';

  const s3HasC = s3Selected.includes('C');
  const s3HasE = s3Selected.includes('E');
  const s3Rank1IsC = scenario3Rankings[0] === 'C';

  if (s3HasC) s3Score += 18;
  if (s3HasE) s3Score += 10;
  if (s3Rank1IsC) s3Score += 6; // Top priority placement bonus
  if (s3Selected.includes('B') && !s3HasE) s3Score += 5;
  if (s3Selected.includes('A')) s3Score += 3;
  if (s3Selected.includes('D')) s3Score += 2;

  s3Score = Math.min(34, Math.max(8, s3Score));

  if (s3HasC && s3HasE) {
    s3Feedback = "Flawless Staged Transition: Piloting on two routes (C) with cash options and deploying cash-to-smartcard kiosks (E) simultaneously protects vulnerable daily-wage commuters while isolating technical bugs at low cost.";
  } else if (s3HasC) {
    s3Feedback = "Prudent Risk Management: Piloting on two routes exposes technical faults when the cost of failure is small, and keeping cash protects passengers who cannot switch yet.";
  } else if (s3Selected.includes('A')) {
    s3Feedback = "High Coercion Risk: Forcing citywide adoption and removing cash in 3 months (A) disenfranchises elderly commuters and daily-wage earners without bank accounts.";
  } else {
    s3Feedback = "Excessive Systemic Risk: Deploying hardware citywide with an untested scale (B) risks massive breakdowns, while canceling the project (D) surrenders modernization benefits.";
  }

  const finalScore = Math.min(100, Math.max(20, s1Score + s2Score + s3Score));
  const optimalCount = [
    s1HasB && s1Rank1IsB,
    s2Score >= 30,
    s3HasC && s3Rank1IsC
  ].filter(Boolean).length;

  let tier: PracticeEvaluationResult['tier'] = 'Tier 4: Tactical Misalignment';
  let tierColor = 'text-red-400 border-red-500/40 bg-red-950/40';
  let summary = '';

  if (finalScore >= 88) {
    tier = 'Tier 1: Master Urban Planner';
    tierColor = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/50';
    summary = 'Outstanding Strategic Command! You addressed root causes rather than symptoms, balanced critical civic infrastructure with community welfare, and managed technology transitions with prudent risk staging.';
  } else if (finalScore >= 70) {
    tier = 'Tier 2: Strategic Transit Analyst';
    tierColor = 'text-cyan-300 border-cyan-500/50 bg-cyan-950/50';
    summary = 'Solid Policy & Operational Execution. You made sound strategic calls across transit reliability and fiscal allocation, keeping core commuter lifelines stable with minor sectoral compromises.';
  } else if (finalScore >= 48) {
    tier = 'Tier 3: Developing Policy Maker';
    tierColor = 'text-amber-300 border-amber-500/50 bg-amber-950/50';
    summary = 'Moderate Strategic Performance. Some decisions targeted immediate symptoms or incurred budget friction, leaving certain stakeholder segments vulnerable.';
  } else {
    tier = 'Tier 4: Tactical Misalignment';
    tierColor = 'text-red-400 border-red-500/50 bg-red-950/50';
    summary = 'Critical Policy Misalignment. Overdrafts, premature technological cutovers, or capital-heavy quick fixes led to severe operational vulnerabilities.';
  }

  const pillars = [
    {
      name: 'Transit Reliability & Root Causes',
      score: Math.round((s1Score / 33) * 100),
      description: 'Prioritizing headway dispatching, vehicle spacing, and signal priority over cosmetic fleet purchases.'
    },
    {
      name: 'Multi-Sector Community Budgeting',
      score: Math.round((s2Score / 33) * 100),
      description: 'Allocating the 100M fund to protect small trader livelihoods and maintain optimal transit alignment without budget breach.'
    },
    {
      name: 'Staged Scaling & Digital Equity',
      score: Math.round((s3Score / 34) * 100),
      description: 'Conducting small-scale pilots with cash retention and accessible kiosks to protect unbanked commuters.'
    }
  ];

  const keyTakeaways = [
    'Solve root causes first: Reliability, headway spacing, and schedule predictability drive ridership far more than vehicle luxury or fare cuts.',
    'Protect community livelihoods: Phased construction, temporary serviced stalls, and early consultation resolve opposition without costly 4 km rerouting or delays.',
    'Test before scaling: Controlled pilots expose technical flaws at low cost, and retaining cash safeguards vulnerable commuters who cannot transition immediately.'
  ];

  return {
    score: finalScore,
    tier,
    tierColor,
    summary,
    correctCount: optimalCount,
    pillars,
    scenarioAudits: {
      scenario1: {
        scenarioNumber: 1,
        scenarioTitle: PRACTICE_SCENARIO_1.title,
        userSummary: `Top 3 Actions Deployed: [${s1Selected.join(', ')}] (Ranks 4-5 in reserve)`,
        suggestedAnswerId: 'B',
        suggestedAnswerSummary: PRACTICE_SCENARIO_1.suggestedAnswerSummary,
        suggestedAnswerExplanation: PRACTICE_SCENARIO_1.suggestedAnswerExplanation,
        isOptimal: s1HasB && s1Rank1IsB,
        score: s1Score,
        maxScore: 33,
        feedback: s1Feedback
      },
      scenario2: {
        scenarioNumber: 2,
        scenarioTitle: PRACTICE_SCENARIO_2.title,
        userSummary: scenario2Data.mode === 'preset'
          ? `Preset Plan [${scenario2Data.presetPlan || 'None'}] (Total LKR ${s2Total}M)`
          : `Custom Allocation: Stalls ${relocationStalls}M, Phasing ${phasedConstruction}M, Support ${livelihoodSupport}M (Total ${s2Total}M)`,
        suggestedAnswerId: 'Plan 2A / C',
        suggestedAnswerSummary: PRACTICE_SCENARIO_2.suggestedAnswerSummary,
        suggestedAnswerExplanation: PRACTICE_SCENARIO_2.suggestedAnswerExplanation,
        isOptimal: s2Score >= 30,
        score: s2Score,
        maxScore: 33,
        feedback: s2Feedback
      },
      scenario3: {
        scenarioNumber: 3,
        scenarioTitle: PRACTICE_SCENARIO_3.title,
        userSummary: `Top 3 Actions Deployed: [${s3Selected.join(', ')}] (Ranks 4-5 in reserve)`,
        suggestedAnswerId: 'C',
        suggestedAnswerSummary: PRACTICE_SCENARIO_3.suggestedAnswerSummary,
        suggestedAnswerExplanation: PRACTICE_SCENARIO_3.suggestedAnswerExplanation,
        isOptimal: s3HasC && s3Rank1IsC,
        score: s3Score,
        maxScore: 34,
        feedback: s3Feedback
      }
    },
    keyTakeaways
  };
}
