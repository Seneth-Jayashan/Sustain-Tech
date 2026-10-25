export interface PracticeAction {
  id: string;
  title: string;
  category: 'Infrastructure' | 'Public Safety' | 'Power & Energy' | 'Environment' | 'Economic';
  cost: number; // in LKR Millions
  tagline: string;
  description: string;
  pros: string;
  cons: string;
  iconName: 'Shield' | 'Users' | 'Zap' | 'Radio' | 'AlertTriangle' | 'DollarSign' | 'Anchor' | 'Compass' | 'Layers';
}

export interface PracticeDay1Data {
  dayNumber: 1;
  title: "Day 1: Acute Storm Landfall & Priority Tactical Containment";
  scenarioSubtitle: "Supercyclone Triton Landfall • 3.8m Storm Surge • Port Perimeter Breach";
  situation: `At 03:00 hours, Category-4 Supercyclone 'Triton' made landfall along the Aurelia Megacity coastal corridor. Tidal surges of 3.8 meters have breached the outer coastal reef and harbor defense levees. Seawater is flooding deep-water container terminals and encroaching on the municipal petrochemical refinery. 

Civilian coastal wards are within the direct flood zone, and the regional high-voltage transmission substation is at imminent risk of water inundation. You must select and prioritize EXACTLY THREE tactical containment directives to mitigate immediate casualties and infrastructure collapse.`;
  actions: PracticeAction[];
}

export interface PracticeDay2Data {
  dayNumber: 2;
  title: "Day 2: Critical Multi-Sector Disaster Resource Allocation";
  scenarioSubtitle: "Systemic Flood Contamination • Acute Utility Failure • LKR 100M Emergency Budget";
  situation: `Storm surge floodwaters have contaminated inland potable aquifers, severed power cables, and inundated district roads. Over 60,000 residents across Aurelia Metro face contaminated drinking water, electricity blackouts, and escalating medical emergencies.

The Disaster Management Cabinet has allocated an Emergency Relief Grant of exactly LKR 100 Million. You must allocate this 100M fund across three critical operational sectors. Overspending beyond 100M is prohibited by treasury rules. Under-allocating critical sectors will cause operational deficits.`;
  totalBudgetCap: 100; // 100M
  presetPlans: PracticePresetPlan[];
  sectors: {
    key: 'gridRestoration' | 'cleanWater' | 'emergencyTrauma';
    label: string;
    maxLimit: number;
    recommendedMin: number;
    description?: string;
    unit: string;
    impactSummary: string;
    riskIfUnderfunded: string;
  }[];
}

export interface PracticePresetPlan {
  id: string;
  title: string;
  tagline: string;
  description: string;
  allocations: {
    gridRestoration: number;
    cleanWater: number;
    emergencyTrauma: number;
  };
  totalCost: number;
  isOverLimit?: boolean;
  pros: string;
  cons: string;
}

export interface PracticeDay3Data {
  dayNumber: 3;
  title: "Day 3: Cascading Resilience & Economic Reconstruction";
  scenarioSubtitle: "Post-Storm Siltation • Displaced Community Recovery • Economic Reboot";
  situation: `Floodwaters have begun to recede, leaving hazardous harbor siltation, damaged distribution logistics, and 45,000 displaced citizens in community shelters. The emergency phase is transitioning into recovery.

You must choose and rank EXACTLY THREE recovery strategies to revive maritime trade, rehabilitate affected families, and fortify natural coastal defenses against recurring storm surges.`;
  actions: PracticeAction[];
}

export const PRACTICE_DAY_1: PracticeDay1Data = {
  dayNumber: 1,
  title: "Day 1: Acute Storm Landfall & Priority Tactical Containment",
  scenarioSubtitle: "Supercyclone Triton Landfall • 3.8m Storm Surge • Port Perimeter Breach",
  situation: `At 03:00 hours, Category-4 Supercyclone 'Triton' made landfall along the Aurelia Megacity coastal corridor. Tidal surges of 3.8 meters have breached the outer coastal reef and harbor defense levees. Seawater is flooding deep-water container terminals and encroaching on the municipal petrochemical refinery. 

Civilian coastal wards are within the direct flood zone, and the regional high-voltage transmission substation is at imminent risk of water inundation. You must select and prioritize EXACTLY THREE tactical containment directives to mitigate immediate casualties and infrastructure collapse.`,
  actions: [
    {
      id: "P1-A",
      title: "Deploy Harbor Pneumatic Inflatable Sea-Barriers",
      category: "Infrastructure",
      cost: 18,
      tagline: "Protects deepwater container docks & crane berths",
      description: "Deploys high-strength pneumatic surge gates across Port Channel Alpha to seal maritime logistics terminals from saltwater inundation.",
      pros: "Shields primary multi-million cargo cranes and heavy trade infrastructure.",
      cons: "High deployment cost and requires continuous air-compressor power.",
      iconName: "Shield"
    },
    {
      id: "P1-B",
      title: "Evacuate Low-Lying Coastal Shanties & Fisherfolk Wards",
      category: "Public Safety",
      cost: 15,
      tagline: "Relocates 28,000 vulnerable coastal residents",
      description: "Mobilizes municipal electric transit bus convoys and emergency tractor shuttles to extract families living in sea-level informal settlements.",
      pros: "Decisively slashes potential civilian drowning casualties and hypothermia.",
      cons: "Heavy convoy traffic blocks main coastal thoroughfares for 4 hours.",
      iconName: "Users"
    },
    {
      id: "P1-C",
      title: "Harden Regional Metro West 220kV Substation",
      category: "Power & Energy",
      cost: 12,
      tagline: "Elevated pumps & diesel generators for municipal grid",
      description: "Dispatches elevated perimeter sandbag barriers and mobile high-capacity dewatering pumps to shield the main electrical sub-station.",
      pros: "Prevents regional blackout of primary hospitals, radar, and emergency telecoms.",
      cons: "Focuses resources exclusively on utility assets rather than direct rescue.",
      iconName: "Zap"
    },
    {
      id: "P1-D",
      title: "Multi-Channel Acoustic Sirens & Automated Cell Broadcast",
      category: "Public Safety",
      cost: 6,
      tagline: "Mandatory stay-at-home siren alert across all mobile networks",
      description: "Triggers loud acoustic sirens across high-risk wards and pushes high-priority emergency alerts to 350,000 registered cell phones.",
      pros: "Rapid, wide-area alert penetration at minimal expenditure.",
      cons: "Passive warning; depends entirely on civilian adherence without transport assistance.",
      iconName: "Radio"
    },
    {
      id: "P1-E",
      title: "Petrochemical Tank Farm Nitrogen Blanketing & Siphonage",
      category: "Environment",
      cost: 16,
      tagline: "Prevents flammable vapor explosion and toxic crude spill",
      description: "Injects stabilizing nitrogen vapor into crude storage silos at the port refinery and engages emergency cutoff valves.",
      pros: "Prevents severe ecocide, toxic atmospheric fumes, and petrochemical bay pollution.",
      cons: "Specialized hazmat operation with no direct impact on floodwater height.",
      iconName: "AlertTriangle"
    }
  ]
};

export const PRACTICE_DAY_2: PracticeDay2Data = {
  dayNumber: 2,
  title: "Day 2: Critical Multi-Sector Disaster Resource Allocation",
  scenarioSubtitle: "Systemic Flood Contamination • Acute Utility Failure • LKR 100M Emergency Budget",
  situation: `Storm surge floodwaters have contaminated inland potable aquifers, severed power cables, and inundated district roads. Over 60,000 residents across Aurelia Metro face contaminated drinking water, electricity blackouts, and escalating medical emergencies.

The Disaster Management Cabinet has allocated an Emergency Relief Grant of exactly LKR 100 Million. You must allocate this 100M fund across three critical operational sectors. Overspending beyond 100M is prohibited by treasury rules. Under-allocating critical sectors will cause operational deficits.`,
  totalBudgetCap: 100,
  presetPlans: [
    {
      id: "2A",
      title: "Plan 2A: Balanced Tri-Sector Shield",
      tagline: "Grid 35M / Clean Water 35M / Trauma Care 30M",
      description: "Equitably distributes the 100M grant across all three crisis fronts, fully funding municipal dewatering pumps while safeguarding clean water and emergency triage.",
      allocations: { gridRestoration: 35, cleanWater: 35, emergencyTrauma: 30 },
      totalCost: 100,
      isOverLimit: false,
      pros: "All three lifelines operate above danger thresholds without starvation.",
      cons: "Balanced split without aggressive acceleration in any single sector."
    },
    {
      id: "2B",
      title: "Plan 2B: Heavy Dewatering & Grid Defense",
      tagline: "Grid 50M / Clean Water 25M / Trauma Care 25M",
      description: "Directs maximum allowable funding (50M) to high-voltage substation repairs and drainage pumps, with 25M to water and 25M to trauma.",
      allocations: { gridRestoration: 50, cleanWater: 25, emergencyTrauma: 25 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Drains stagnant saltwater rapidly and re-energizes municipal communications.",
      cons: "Leaves water and medical sectors operating at narrow baseline margins."
    },
    {
      id: "2C",
      title: "Plan 2C: Potable Water & Anti-Epidemic Surge",
      tagline: "Grid 20M / Clean Water 50M / Trauma Care 30M",
      description: "Prioritizes mobile reverse-osmosis purification convoys (50M) to eliminate waterborne contamination, allocating 20M to grid and 30M to trauma.",
      allocations: { gridRestoration: 20, cleanWater: 50, emergencyTrauma: 30 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Completely inoculates 60,000 displaced citizens against cholera and toxic runoff.",
      cons: "Pumping operations run at minimum speed; floodwaters take longer to recede."
    },
    {
      id: "2D",
      title: "Plan 2D: Mobile Trauma & ICU Surge",
      tagline: "Grid 25M / Clean Water 25M / Trauma Care 50M",
      description: "Focuses maximum funding (50M) on negative-pressure mobile surgery units, blood supplies, and hypothermia stabilization.",
      allocations: { gridRestoration: 25, cleanWater: 25, emergencyTrauma: 50 },
      totalCost: 100,
      isOverLimit: false,
      pros: "Cuts clinical mortality among severe crush and storm injury casualties.",
      cons: "Heavily hospital-centric; does not accelerate municipal grid or water recovery."
    },
    {
      id: "2E",
      title: "Plan 2E: Statutory Overdraft Plan (Over Cap)",
      tagline: "Grid 50M / Clean Water 40M / Trauma Care 30M = 120M (INVALID)",
      description: "Attempts to allocate LKR 120M across all three sectors, breaching the statutory LKR 100M round limit set by the Disaster Management Cabinet.",
      allocations: { gridRestoration: 50, cleanWater: 40, emergencyTrauma: 30 },
      totalCost: 120,
      isOverLimit: true,
      pros: "Maximum theoretical funding across all three sectors.",
      cons: "Strictly rejected by treasury audit controllers; causes governance penalties."
    }
  ],
  sectors: [
    {
      key: 'gridRestoration',
      label: 'Sector A: Power Grid & Stormwater Pumping',
      maxLimit: 50,
      recommendedMin: 20,
      unit: 'M LKR',
      impactSummary: 'Powers heavy submersible stormwater pumps, high-voltage transformer repair teams, and critical telecommunication towers.',
      riskIfUnderfunded: 'Underfunding below 20M LKR leaves city pumps offline, leading to stagnant seawater retention and prolonged regional blackouts.'
    },
    {
      key: 'cleanWater',
      label: 'Sector B: Clean Water & Desalination Convoys',
      maxLimit: 50,
      recommendedMin: 25,
      unit: 'M LKR',
      impactSummary: 'Deploys mobile reverse-osmosis purification trucks, bottled water bladders, and emergency hydration stations to relief shelters.',
      riskIfUnderfunded: 'Underfunding below 25M LKR causes contaminated aquifer consumption, sparking virulent cholera and dysentery outbreaks.'
    },
    {
      key: 'emergencyTrauma',
      label: 'Sector C: Mobile Trauma Units & Field Hospitals',
      maxLimit: 50,
      recommendedMin: 20,
      unit: 'M LKR',
      impactSummary: 'Equips pop-up negative pressure surgical tents, hazmat decontamination showers, and emergency hypothermia treatment supplies.',
      riskIfUnderfunded: 'Underfunding below 20M LKR overwhelms central hospital trauma bays, spiking preventable storm surge mortality.'
    }
  ]
};

export const PRACTICE_DAY_3: PracticeDay3Data = {
  dayNumber: 3,
  title: "Day 3: Cascading Resilience & Economic Reconstruction",
  scenarioSubtitle: "Post-Storm Siltation • Displaced Community Recovery • Economic Reboot",
  situation: `Floodwaters have begun to recede, leaving hazardous harbor siltation, damaged distribution logistics, and 45,000 displaced citizens in community shelters. The emergency phase is transitioning into recovery.

You must choose and rank EXACTLY THREE recovery strategies to revive maritime trade, rehabilitate affected families, and fortify natural coastal defenses against recurring storm surges.`,
  actions: [
    {
      id: "P3-A",
      title: "Direct Digital Micro-Grants for Displaced Households",
      category: "Public Safety",
      cost: 25,
      tagline: "LKR 50,000 cash grant to verified flooded families",
      description: "Direct bank and mobile-wallet relief transfers to 5,000 low-income flood victims for urgent dry goods, building materials, and clothing.",
      pros: "Immediate dignity and purchasing power to local families; jumpstarts grocery commerce.",
      cons: "High cash drain on relief treasury; requires strict identity verification.",
      iconName: "DollarSign"
    },
    {
      id: "P3-B",
      title: "Sonar Dredging & Port Channel Silt Clearance",
      category: "Economic",
      cost: 20,
      tagline: "Restores deepwater shipping navigation and container exports",
      description: "Deploys specialized suction dredging vessels to clear 120,000 cubic meters of storm silt and submerged shipping containers from main berths.",
      pros: "Reopens multi-million dollar container vessel traffic, preventing manufacturing supply chain collapse.",
      cons: "Benefits industrial trade directly before residential neighborhood cleanup.",
      iconName: "Anchor"
    },
    {
      id: "P3-C",
      title: "Thermal Drone Survey & Autonomous Grid Line Splice",
      category: "Infrastructure",
      cost: 12,
      tagline: "AI drone diagnostics to accelerate power pole reconstruction",
      description: "Deploys aerial lidar drones to detect micro-fractures in transmission towers and direct high-priority repair crews.",
      pros: "Cuts grid restoration time by 60% with highly accurate telemetry.",
      cons: "High-tech tool that requires specialized ground operators.",
      iconName: "Compass"
    },
    {
      id: "P3-D",
      title: "Demurrage Waiver & Commercial Supply Freight Subsidy",
      category: "Economic",
      cost: 10,
      tagline: "Waives port storage fees for merchant vessels carrying food & fuel",
      description: "Suspends government docking and demurrage penalties for 14 days to incentivize global shipping carriers to unload emergency cargo.",
      pros: "Suppresses price gouging and stabilizes food staples in the municipal market.",
      cons: "Temporarily foregoes government port revenue.",
      iconName: "Layers"
    },
    {
      id: "P3-E",
      title: "Mangrove Bio-Shield & Living Dune Restoration",
      category: "Environment",
      cost: 15,
      tagline: "Replants 40 hectares of native coastal mangroves and geotextile dunes",
      description: "Engages community eco-corps to plant deep-root coastal mangroves and rebuild sand berms to blunt future cyclone storm waves.",
      pros: "Creates long-term natural flood attenuation barrier and restores estuarine fish nurseries.",
      cons: "Takes months to mature; provides negligible immediate relief in week one.",
      iconName: "Shield"
    }
  ]
};

export interface PracticeEvaluationResult {
  score: number; // 0 - 100
  tier: 'Tier 1: Exemplary Command' | 'Tier 2: Competent Crisis Manager' | 'Tier 3: Vulnerable Operations' | 'Tier 4: Critical Breakdown';
  tierColor: string;
  summary: string;
  pillars: {
    name: string;
    score: number; // 0 - 100
    description: string;
  }[];
  day1Breakdown: {
    selectedIds: string[];
    score: number; // out of 30
    feedback: string;
  };
  day2Breakdown: {
    allocations: {
      gridRestoration: number;
      cleanWater: number;
      emergencyTrauma: number;
    };
    total: number;
    score: number; // out of 40
    feedback: string;
  };
  day3Breakdown: {
    selectedIds: string[];
    score: number; // out of 30
    feedback: string;
  };
  keyTakeaways: string[];
}

export function evaluatePracticeGame(
  day1Rankings: string[],
  day2Allocations: { gridRestoration: number; cleanWater: number; emergencyTrauma: number },
  day3Rankings: string[]
): PracticeEvaluationResult {
  // Day 1 Evaluation (Max 30)
  let d1Score = 0;
  const d1Selected = day1Rankings.slice(0, 3);
  
  // Life safety synergy: P1-B (Evacuation) + P1-C (Substation Power) + P1-E (Refinery Hazmat) or P1-A (Barriers)
  if (d1Selected.includes('P1-B')) d1Score += 11; // Evacuating vulnerable citizens is top life saver
  if (d1Selected.includes('P1-C')) d1Score += 10; // Preserving regional electrical grid
  if (d1Selected.includes('P1-E')) d1Score += 9;  // Hazmat containment prevents toxic spill
  if (d1Selected.includes('P1-A') && !d1Selected.includes('P1-E')) d1Score += 8;
  if (d1Selected.includes('P1-D') && !d1Selected.includes('P1-B')) d1Score += 5;
  d1Score = Math.min(30, Math.max(12, d1Score));

  let d1Feedback = '';
  if (d1Selected.includes('P1-B') && d1Selected.includes('P1-C')) {
    d1Feedback = 'Outstanding tactical balance: Prioritizing civilian evacuation alongside substation grid power safeguarded human life while preserving critical telecom and hospital systems.';
  } else if (d1Selected.includes('P1-B')) {
    d1Feedback = 'Strong humanitarian prioritization: Evacuating the coastal settlements eliminated immediate drowning risks, though secondary utility challenges remained.';
  } else {
    d1Feedback = 'Infrastructure-heavy focus: Industrial and alert mechanisms were activated, but delayed evacuation of coastal informal settlements left vulnerable families exposed.';
  }

  // Day 2 Evaluation (Max 40)
  // Day 4-style resource allocation
  const { gridRestoration, cleanWater, emergencyTrauma } = day2Allocations;
  const total = gridRestoration + cleanWater + emergencyTrauma;
  let d2Score = 0;

  if (total > 100) {
    d2Score = 10; // Severe deficit for overspending
  } else if (total < 60) {
    d2Score = 18; // Under-spending during active emergency
  } else {
    // Reward balanced allocation that satisfies recommended minimums
    let base = 25;
    // Check if sectors meet threshold
    if (gridRestoration >= 20) base += 5;
    else if (gridRestoration >= 10) base += 2;

    if (cleanWater >= 25) base += 5;
    else if (cleanWater >= 15) base += 2;

    if (emergencyTrauma >= 20) base += 5;
    else if (emergencyTrauma >= 10) base += 2;

    // Bonus for spending nearly all 100M effectively
    if (total >= 90 && total <= 100) base += 5;

    d2Score = Math.min(40, base);
  }

  let d2Feedback = '';
  if (total > 100) {
    d2Feedback = `Budget Breach: Total allocation (${total}M LKR) exceeded the authorized 100M ceiling. Overdrawing was intercepted by treasury controllers.`;
  } else if (gridRestoration >= 20 && cleanWater >= 25 && emergencyTrauma >= 20) {
    d2Feedback = `Exemplary Allocation: Balanced ${gridRestoration}M Grid, ${cleanWater}M Water, and ${emergencyTrauma}M Medical. No critical lifeline suffered operational starvation.`;
  } else if (cleanWater < 20) {
    d2Feedback = `Water Vulnerability: Clean water was underfunded (${cleanWater}M < 25M recommended), increasing the hazard of acute gastrointestinal epidemics.`;
  } else if (gridRestoration < 20) {
    d2Feedback = `Drainage Latency: Power & pumping was underfunded (${gridRestoration}M < 20M recommended), prolonging stagnant saltwater retention in urban basins.`;
  } else {
    d2Feedback = `Functional Distribution: Allocated ${total}M / 100M. Core services were maintained, though certain sectoral tradeoffs constrained rapid recovery.`;
  }

  // Day 3 Evaluation (Max 30)
  let d3Score = 0;
  const d3Selected = day3Rankings.slice(0, 3);
  if (d3Selected.includes('P3-A')) d3Score += 10; // Direct household relief
  if (d3Selected.includes('P3-B')) d3Score += 10; // Reopening port commerce
  if (d3Selected.includes('P3-C')) d3Score += 8;  // Fast drone grid mapping
  if (d3Selected.includes('P3-E')) d3Score += 7;  // Mangrove bio-shield
  if (d3Selected.includes('P3-D')) d3Score += 6;  // Demurrage relief
  d3Score = Math.min(30, Math.max(14, d3Score));

  let d3Feedback = '';
  if (d3Selected.includes('P3-A') && d3Selected.includes('P3-B')) {
    d3Feedback = 'Harmonious Dual Recovery: Coupling direct household survival grants with harbor dredging successfully stabilized both community welfare and commercial supply chains.';
  } else if (d3Selected.includes('P3-A')) {
    d3Feedback = 'People-First Recovery: Prioritizing micro-grants directly aided displaced families, though maritime trade bottlenecks required secondary clearance.';
  } else {
    d3Feedback = 'Industrial-Led Recovery: Shipping lanes and infrastructure diagnostics were prioritized, establishing trade foundations while citizen relief moved at moderate speed.';
  }

  const finalScore = Math.min(100, Math.max(20, d1Score + d2Score + d3Score));

  let tier: PracticeEvaluationResult['tier'] = 'Tier 4: Critical Breakdown';
  let tierColor = 'text-red-400 border-red-500/40 bg-red-950/40';
  let summary = '';

  if (finalScore >= 85) {
    tier = 'Tier 1: Exemplary Command';
    tierColor = 'text-emerald-300 border-emerald-500/50 bg-emerald-950/50';
    summary = 'Outstanding Command Performance! You demonstrated superior strategic synchronization across acute tactical containment, multi-sector resource budgeting, and sustainable community recovery.';
  } else if (finalScore >= 70) {
    tier = 'Tier 2: Competent Crisis Manager';
    tierColor = 'text-cyan-300 border-cyan-500/50 bg-cyan-950/50';
    summary = 'Solid Operational Management. You effectively stabilized Aurelia Metro with sound tactical instincts and controlled budget execution, maintaining essential lifelines under stress.';
  } else if (finalScore >= 50) {
    tier = 'Tier 3: Vulnerable Operations';
    tierColor = 'text-amber-300 border-amber-500/50 bg-amber-950/50';
    summary = 'Pyrrhic Survival. The metropolitan area avoided complete catastrophe, but severe sectoral imbalances or underfunded lifelines resulted in lingering vulnerabilities.';
  } else {
    tier = 'Tier 4: Critical Breakdown';
    tierColor = 'text-red-400 border-red-500/50 bg-red-950/50';
    summary = 'Systemic Crisis. Misaligned resource allocations and tactical delays allowed compounding hazards to overwhelm regional capacity.';
  }

  const pillars = [
    {
      name: 'Tactical Threat Mitigation',
      score: Math.round((d1Score / 30) * 100),
      description: 'Rapid response to acute coastal storm surge and flood perimeter breaches.'
    },
    {
      name: 'Emergency Budget Allocation',
      score: Math.round((d2Score / 40) * 100),
      description: 'Disaster fund distribution across grid, water purification, and emergency trauma triage.'
    },
    {
      name: 'Resilient Recovery & Continuity',
      score: Math.round((d3Score / 30) * 100),
      description: 'Strategic balance between immediate citizen rehabilitation and macroeconomic port reboot.'
    }
  ];

  const keyTakeaways = [
    'Always prioritize life protection and electrical transmission in initial disaster hours to prevent secondary utility cascade.',
    'Multi-sector budgeting (like Day 2) requires balanced spending: starve none of the lifelines (power, clean water, medical).',
    'Post-disaster recovery is most sustainable when coupling immediate citizen cash transfers with commercial trade channel clearance.'
  ];

  return {
    score: finalScore,
    tier,
    tierColor,
    summary,
    pillars,
    day1Breakdown: {
      selectedIds: d1Selected,
      score: d1Score,
      feedback: d1Feedback
    },
    day2Breakdown: {
      allocations: day2Allocations,
      total,
      score: d2Score,
      feedback: d2Feedback
    },
    day3Breakdown: {
      selectedIds: d3Selected,
      score: d3Score,
      feedback: d3Feedback
    },
    keyTakeaways
  };
}
