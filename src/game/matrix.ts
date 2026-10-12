import { Action } from './types';

export const ACTION_MATRIX: Action[] = [
  // BUCKET 1 (Day 0) - Early Warning and Uncertainty
  {
    id: '1A',
    bucket: 1,
    recommendedRank: 1,
    title: 'Inspect water sources and identify vulnerable communities',
    description: 'Assess local wells, reservoirs, and streams while surveying high-risk communities.',
    impacts: { floodPreparedness: 6, droughtPreparedness: 8, emergencyBudget: -10, communityTrust: 5, informationQuality: 15 },
    rationale: 'Builds vital baseline data for both hazards at low cost with maximum information payoff.'
  },
  {
    id: '1D',
    bucket: 1,
    recommendedRank: 2,
    title: 'Communicate uncertainty and preparedness guidance to communities',
    description: 'Provide clear public advisories explaining forecast uncertainty and actionable home preparations.',
    impacts: { floodPreparedness: 8, droughtPreparedness: 4, emergencyBudget: -5, communityTrust: 10, informationQuality: 6 },
    rationale: 'High trust and compliance multiplier at minimal expense.'
  },
  {
    id: '1C',
    bucket: 1,
    recommendedRank: 3,
    title: 'Clear priority drainage channels in flood-prone communities',
    description: 'Excavate silt and remove debris from critical drainage routes in low-lying settlements.',
    impacts: { floodPreparedness: 12, droughtPreparedness: 0, emergencyBudget: -40, communityTrust: 4, informationQuality: 2 },
    rationale: 'Direct preventive flood mitigation before heavy downpours begin.'
  },
  {
    id: '1B',
    bucket: 1,
    recommendedRank: 4,
    title: 'Purchase a large emergency stock of bottled water immediately',
    description: 'Pre-emptively buy commercial bottled water reserves for drought-hit zones.',
    impacts: { floodPreparedness: 0, droughtPreparedness: 10, emergencyBudget: -120, communityTrust: 4, informationQuality: 0 },
    rationale: 'Hedges against drought but prematurely burns 24% of the emergency treasury.'
  },
  {
    id: '1E',
    bucket: 1,
    recommendedRank: 5,
    title: 'Wait for a more certain forecast before acting',
    description: 'Withhold operational decisions until high-confidence satellite projections arrive.',
    impacts: { floodPreparedness: -10, droughtPreparedness: -5, emergencyBudget: 0, communityTrust: -8, informationQuality: -5 },
    rationale: 'Preserves budget initially but severely erodes preparedness lead time and public confidence.'
  },

  // BUCKET 2 (Day 2) - Compound Hazard
  {
    id: '2B',
    bucket: 2,
    recommendedRank: 1,
    title: 'Combine official forecasts, river/reservoir observations and verified local reports',
    description: 'Triangulate Met Dept data, river-gauge telemetry, and ground observer reports.',
    impacts: { floodPreparedness: 12, droughtPreparedness: 8, emergencyBudget: -8, communityTrust: 6, informationQuality: 15 },
    rationale: 'Authoritative data-fusion approach delivering high situational awareness for both zones.'
  },
  {
    id: '2E',
    bucket: 2,
    recommendedRank: 2,
    title: 'Establish a district-level monitoring network with local authorities and community observers',
    description: 'Deploy divisional monitoring cells with local leaders and trained spotters.',
    impacts: { floodPreparedness: 10, droughtPreparedness: 8, emergencyBudget: -20, communityTrust: 10, informationQuality: 10 },
    rationale: 'Institutionalizes decentralized ground observation and community buy-in.'
  },
  {
    id: '2C',
    bucket: 2,
    recommendedRank: 3,
    title: 'Spend most of the emergency budget immediately on both hazards',
    description: 'Disburse massive emergency funding across both disaster zones without complete verification.',
    impacts: { floodPreparedness: 8, droughtPreparedness: 6, emergencyBudget: -300, communityTrust: 2, informationQuality: -2 },
    rationale: 'Provides physical supplies but exhausts 60% of total national reserve in a single round.'
  },
  {
    id: '2A',
    bucket: 2,
    recommendedRank: 4,
    title: 'Depend mainly on social-media reports because they arrive fastest',
    description: 'Base emergency logistics primarily on viral social feeds and unverified chat groups.',
    impacts: { floodPreparedness: 2, droughtPreparedness: 0, emergencyBudget: -2, communityTrust: -6, informationQuality: -12 },
    rationale: 'Rapid reporting poisoned by misinformation and panic, heavily degrading information quality.'
  },
  {
    id: '2D',
    bucket: 2,
    recommendedRank: 5,
    title: 'Wait until flooding becomes severe before activating response',
    description: 'Postpone mobilization until river levels breach critical flood gauges.',
    impacts: { floodPreparedness: -12, droughtPreparedness: -4, emergencyBudget: 0, communityTrust: -10, informationQuality: -4 },
    rationale: 'Leaves field units with inadequate rescue lead time, multiplying human vulnerability.'
  },

  // BUCKET 3 (Day 4) - Allocating LKR 100M Against LKR 120M of Needs
  {
    id: '3A',
    bucket: 3,
    recommendedRank: 1,
    title: 'Evacuation 40 / Water 30 / Medical 30',
    description: 'Fully funds Kelani evacuation (LKR 40M) and divides remaining 60M between water (30M) and medical (30M).',
    impacts: { floodPreparedness: 10, droughtPreparedness: 4, emergencyBudget: -100, communityTrust: 10, informationQuality: 3 },
    rationale: 'Prioritizes life-saving evacuation while sustaining vital medical and water buffers.'
  },
  {
    id: '3D',
    bucket: 3,
    recommendedRank: 2,
    title: 'Evacuation 30 / Water 40 / Medical 30',
    description: 'Allocates LKR 30M evacuation, LKR 40M drinking water, and LKR 30M medical supplies.',
    impacts: { floodPreparedness: 8, droughtPreparedness: 6, emergencyBudget: -100, communityTrust: 8, informationQuality: 2 },
    rationale: 'Strong balanced mitigation across both hazard fronts.'
  },
  {
    id: '3C',
    bucket: 3,
    recommendedRank: 3,
    title: 'Evacuation 40 / Water 50 / Medical 10',
    description: 'Allocates LKR 40M evacuation, LKR 50M drinking water, and LKR 10M medical supplies.',
    impacts: { floodPreparedness: 10, droughtPreparedness: 8, emergencyBudget: -100, communityTrust: -2, informationQuality: 1 },
    rationale: 'Underfunds emergency healthcare, triggering public dissatisfaction and triage strain.'
  },
  {
    id: '3B',
    bucket: 3,
    recommendedRank: 4,
    title: 'Evacuation 60 / Water 40 / Medical 0',
    description: 'Allocates LKR 60M evacuation, LKR 40M drinking water, and LKR 0M medical supplies.',
    impacts: { floodPreparedness: 12, droughtPreparedness: 6, emergencyBudget: -100, communityTrust: -10, informationQuality: 0 },
    rationale: 'Zero medical funding causes clinic stockouts and steep collapse in community trust.'
  },
  {
    id: '3E',
    bucket: 3,
    recommendedRank: 5,
    title: 'Release the full LKR 120M (breaks the LKR 100M limit; invalid)',
    description: 'Breaches statutory fiscal ceilings by spending LKR 120M against a LKR 100M round allowance.',
    impacts: { floodPreparedness: 4, droughtPreparedness: 4, emergencyBudget: -120, communityTrust: -15, informationQuality: -10 },
    rationale: 'Violates administrative spending limits, prompting governance chaos and severe penalties.'
  },

  // BUCKET 4 (Day 6) - Trucks, Rescue Vehicles and Boats
  {
    id: '4A',
    bucket: 4,
    recommendedRank: 1,
    title: 'Trucks 8 / 12, rescue vehicles 24 / 6, boats 20 / 0',
    description: 'Flood: 8 trucks, 24 rescue vehicles, 20 boats | Dry Zone: 12 trucks, 6 rescue vehicles, 0 boats.',
    impacts: { floodPreparedness: 14, droughtPreparedness: 10, emergencyBudget: -60, communityTrust: 10, informationQuality: 3 },
    rationale: 'Optimal asset-to-task matching: boats stay where there is water; heavy trucks haul dry-zone bowsers.'
  },
  {
    id: '4B',
    bucket: 4,
    recommendedRank: 2,
    title: 'Trucks 0 / 20, rescue vehicles 30 / 0, boats 20 / 0 (each asset to its natural use)',
    description: 'All 20 trucks haul dry-zone water; all 30 rescue vehicles and 20 boats deploy to Kelani flood.',
    impacts: { floodPreparedness: 13, droughtPreparedness: 11, emergencyBudget: -60, communityTrust: 5, informationQuality: 2 },
    rationale: 'Strong specialization but leaves flood logistics lacking heavy supply transport.'
  },
  {
    id: '4C',
    bucket: 4,
    recommendedRank: 3,
    title: 'Equal split: trucks 10 / 10, vehicles 15 / 15, boats 10 / 10',
    description: 'Divides fleets 50/50 across both zones regardless of geographic applicability.',
    impacts: { floodPreparedness: 6, droughtPreparedness: 6, emergencyBudget: -60, communityTrust: 2, informationQuality: 0 },
    rationale: 'Wasteful: sends 10 rescue boats to drought regions where they sit idle on dry ground.'
  },
  {
    id: '4D',
    bucket: 4,
    recommendedRank: 4,
    title: 'Everything to flood rescue',
    description: 'Diverts 100% of trucks, rescue vehicles, and boats to the Kelani flood zone.',
    impacts: { floodPreparedness: 18, droughtPreparedness: -10, emergencyBudget: -60, communityTrust: -5, informationQuality: 0 },
    rationale: 'Maximizes flood mitigation while completely abandoning drought communities.'
  },
  {
    id: '4E',
    bucket: 4,
    recommendedRank: 5,
    title: 'Hold all resources in reserve and wait for external assistance',
    description: 'Keep all national transport fleets staged in depots awaiting foreign humanitarian missions.',
    impacts: { floodPreparedness: -8, droughtPreparedness: -8, emergencyBudget: 0, communityTrust: -10, informationQuality: -2 },
    rationale: 'Paralyzes response during the critical 3.5-hour flood surge window.'
  },

  // BUCKET 5 (Day 8) - Landslides, Blocked Roads, Telecom Failure and Dry-Zone Shortage
  {
    id: '5A',
    bucket: 5,
    recommendedRank: 1,
    title: 'Order evacuation of people in identified high-risk flood and landslide zones',
    description: 'Enforce mandatory evacuation of endangered slope communities in Ratnapura and Kalutara.',
    impacts: { floodPreparedness: 18, droughtPreparedness: 0, emergencyBudget: -40, communityTrust: 12, informationQuality: 4 },
    rationale: 'Direct life-safety intervention addressing imminent landslide mortality.'
  },
  {
    id: '5C',
    bucket: 5,
    recommendedRank: 2,
    title: 'Establish emergency coordination and triage points serving both hazard zones',
    description: 'Set up regional satellite communication hubs and forward triage clinics for both zones.',
    impacts: { floodPreparedness: 9, droughtPreparedness: 6, emergencyBudget: -30, communityTrust: 8, informationQuality: 8 },
    rationale: 'Restores operational command across severed communications lines.'
  },
  {
    id: '5E',
    bucket: 5,
    recommendedRank: 3,
    title: 'Suspend non-essential government expenditure and redirect funds to emergency response',
    description: 'Freeze auxiliary agency budgets and redirect +LKR 60M into emergency operations.',
    impacts: { floodPreparedness: 6, droughtPreparedness: 5, emergencyBudget: 60, communityTrust: -2, informationQuality: 2 },
    rationale: 'Frees critical financial liquidity despite temporary bureaucratic friction.'
  },
  {
    id: '5B',
    bucket: 5,
    recommendedRank: 4,
    title: 'Airdrop drinking water to every affected Dry-Zone community',
    description: 'Charter heavy helicopters to drop bottled water across extensive rural dry zones.',
    impacts: { floodPreparedness: 0, droughtPreparedness: 6, emergencyBudget: -100, communityTrust: 2, informationQuality: 0 },
    rationale: 'Extremely costly and logistically inefficient compared to ground-based water bowsers.'
  },
  {
    id: '5D',
    bucket: 5,
    recommendedRank: 5,
    title: 'Evacuate only residents who volunteer',
    description: 'Limit relocation to citizens who willingly abandon homes on active slip planes.',
    impacts: { floodPreparedness: -15, droughtPreparedness: 0, emergencyBudget: 0, communityTrust: -8, informationQuality: -2 },
    rationale: 'Abdication of public duty leading to severe avoidable casualties.'
  },

  // BUCKET 6 (Day 10) - From Emergency Response to Recovery
  {
    id: '6A',
    bucket: 6,
    recommendedRank: 1,
    title: 'Rapid multi-sector damage and needs assessment, then prioritize water, health, roads and shelter',
    description: 'Conduct comprehensive Post-Disaster Needs Assessment (PDNA) to guide structured rehabilitation.',
    impacts: { floodPreparedness: 8, droughtPreparedness: 8, emergencyBudget: -15, communityTrust: 10, informationQuality: 15 },
    rationale: 'Grounds recovery spending on verified field diagnostics rather than guesswork.'
  },
  {
    id: '6C',
    bucket: 6,
    recommendedRank: 2,
    title: 'Strengthen disease surveillance, safe water, sanitation and emergency health services',
    description: 'Deploy well-chlorination squads, water-testing kits, and mobile public health surveillance.',
    impacts: { floodPreparedness: 4, droughtPreparedness: 10, emergencyBudget: -50, communityTrust: 12, informationQuality: 6 },
    rationale: 'Prevents secondary epidemics (Dengue, Cholera, waterborne illness) in aftermath.'
  },
  {
    id: '6B',
    bucket: 6,
    recommendedRank: 3,
    title: 'Restore critical roads, clear debris and rehabilitate damaged water infrastructure',
    description: 'Mobilize earthmovers to clear landslides, repair bridges, and reconnect piped water mains.',
    impacts: { floodPreparedness: 10, droughtPreparedness: 8, emergencyBudget: -80, communityTrust: 8, informationQuality: 2 },
    rationale: 'Re-establishes physical accessibility and long-term lifeline utilities.'
  },
  {
    id: '6E',
    bucket: 6,
    recommendedRank: 4,
    title: 'Request external assistance and coordinate donor support against a documented needs list',
    description: 'Submit verified needs list to UN/international partners, securing +LKR 50M in matched aid.',
    impacts: { floodPreparedness: 4, droughtPreparedness: 4, emergencyBudget: 50, communityTrust: 6, informationQuality: 8 },
    rationale: 'Multiplies available resources through structured multilateral cooperation.'
  },
  {
    id: '6D',
    bucket: 6,
    recommendedRank: 5,
    title: 'Strictly ration remaining food and water without reassessing community needs',
    description: 'Enforce harsh uniform rations without checking actual surviving local supplies.',
    impacts: { floodPreparedness: -2, droughtPreparedness: 2, emergencyBudget: 0, communityTrust: -12, informationQuality: -8 },
    rationale: 'Harsh austerity under uncertainty sparks civil unrest and deep public resentment.'
  }
];

export const RANK_WEIGHTS = [1.0, 0.8, 0.6, 0.4, 0.2]; // 1st = 1.0, 2nd = 0.8, 3rd = 0.6, 4th = 0.4, 5th = 0.2
