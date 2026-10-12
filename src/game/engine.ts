import { 
  ActionId, FinalResult, PreparednessRating, ScenarioOutcome, 
  EndingTier, FailureStates, DynamicEventTrigger, BucketDecision, Action,
  ScoreCalculationDetails
} from './types';
import { ACTION_MATRIX } from './matrix';
import { SCENARIOS, BucketScenario } from './scenario';
import { GameState, getInitialGameState } from './state';

export interface DecisionDelta {
  floodPreparedness: number;
  droughtPreparedness: number;
  emergencyBudget: number; // in LKR Millions
  communityTrust: number;
  informationQuality: number;
  decisionQuality: number;
  executedActionIds?: string[];
  triggeredEvents?: DynamicEventTrigger[];
  tradeoffs?: string[];
}

/**
 * Resolves an action by ID, supporting canonical IDs ('1A', '2B'), case-insensitive matches,
 * and positional aliases ('B1_ACT_1', 'B2_ACT_3').
 */
export function findAction(actionId: string, bucket?: number): Action | undefined {
  if (!actionId) return undefined;
  
  // 1. Direct ID match
  let action = ACTION_MATRIX.find(a => a.id === actionId);
  if (action) return action;

  // 2. Case-insensitive
  action = ACTION_MATRIX.find(a => a.id.toLowerCase() === actionId.toLowerCase());
  if (action) return action;

  // 3. Alias match: B{bucket}_ACT_{num} or B{bucket}_ACT_{letter}
  const match = actionId.match(/^B(\d+)_ACT_([1-5]|[A-E])$/i);
  if (match) {
    const b = parseInt(match[1]);
    const val = match[2].toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(val)) {
      action = ACTION_MATRIX.find(a => a.id === `${b}${val}`);
      if (action) return action;
    } else {
      const idx = parseInt(val) - 1;
      const letter = ['A', 'B', 'C', 'D', 'E'][idx];
      action = ACTION_MATRIX.find(a => a.id === `${b}${letter}`);
      if (action) return action;
    }
  }

  // 4. Inferred from bucket and trailing letter/digit
  if (bucket) {
    const trailing = actionId.slice(-1).toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(trailing)) {
      action = ACTION_MATRIX.find(a => a.id === `${bucket}${trailing}`);
      if (action) return action;
    }
    const num = parseInt(trailing);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      const letter = ['A', 'B', 'C', 'D', 'E'][num - 1];
      action = ACTION_MATRIX.find(a => a.id === `${bucket}${letter}`);
      if (action) return action;
    }
  }

  return undefined;
}

/**
 * Operational execution efficacy multipliers based on priority rank.
 * 1st action executes immediately; 3rd action executes with standard lead time.
 */
export const EXECUTION_EFFICACY_WEIGHTS = [1.0, 0.85, 0.70, 0.40, 0.20];

/**
 * Evaluates dynamic inter-round events and feedback loops based on current state.
 * Decisions made on Day 0 shape conditions on Day 2, Day 4, etc.
 */
export function evaluateDynamicInterRoundEvents(state: GameState): DynamicEventTrigger[] {
  const events: DynamicEventTrigger[] = [];

  // 1. Intelligence Deficit / Early Warning Dividend
  if (state.bucket === 2 || state.bucket === 3) {
    if (state.information.informationQuality < 45) {
      events.push({
        id: 'INTEL_DEFICIT_FOG_OF_WAR',
        title: 'Tactical Blindspot: Gauge Inaccuracy',
        description: 'Low sensor calibration and conflicting field reports delayed early evacuation orders in vulnerable low-lying zones.',
        impactType: 'warning',
        effects: {
          floodPreparedness: -8,
          communityTrust: -6,
        }
      });
    } else if (state.information.informationQuality >= 65) {
      events.push({
        id: 'INTEL_DIVIDEND',
        title: 'Intelligence Dividend: Precision Hydrology',
        description: 'High-resolution radar telemetry and community monitoring enabled optimal spillway timing before peak runoff.',
        impactType: 'positive',
        effects: {
          floodPreparedness: 10,
          informationQuality: 5,
        }
      });
    }
  }

  // 2. Downstream Distrust & Evacuation Compliance Crisis
  if (state.bucket >= 4) {
    if (state.community.communityTrust < 40) {
      events.push({
        id: 'COMMUNITY_EVAC_RESISTANCE',
        title: 'Public Distrust: Evacuation Resistance',
        description: 'Past uncoordinated warnings caused distrust. Residents resisted moving to shelters, necessitating costly security deployments.',
        impactType: 'negative',
        effects: {
          communityTrust: -12,
          floodPreparedness: -8,
        }
      });
    }
  }

  // 3. Reservoir Over-Release / Dry-Zone Drought Shock
  if (state.bucket >= 4) {
    if (state.scores.droughtPreparedness < 45) {
      events.push({
        id: 'DRY_ZONE_WATER_SHOCK',
        title: 'Upstream Over-Release: Agricultural Water Stress',
        description: 'Severe neglect of Dry-Zone water distribution and aggressive dam flushing created acute drinking water and agrarian deficits.',
        impactType: 'warning',
        effects: {
          droughtPreparedness: -15,
          communityTrust: -8,
        }
      });
    }
  }

  // 4. Catastrophic Flood Overflow / Levee Failure
  if (state.bucket >= 4) {
    if (state.scores.floodPreparedness < 45) {
      events.push({
        id: 'KELANI_LEVEE_OVERTOP',
        title: 'Downstream Levee Breach: Kelani Inundation',
        description: 'Inadequate upstream buffer drainage and delayed flood mobilization led to levee overtopping in suburban settlements.',
        impactType: 'negative',
        effects: {
          floodPreparedness: -18,
          communityTrust: -10,
        }
      });
    }
  }

  // 5. Fiscal Liquidity Constraint
  if (state.bucket >= 5) {
    if (state.resources.emergencyBudget <= 60) {
      events.push({
        id: 'FISCAL_STRESS_LIQUIDITY',
        title: 'Provincial Treasury Exhaustion',
        description: 'Treasury reserves dipped critically low, delaying commercial contractor procurements for emergency repairs.',
        impactType: 'negative',
        effects: {
          floodPreparedness: -6,
          communityTrust: -4,
        }
      });
    }
  }

  return events;
}

/**
 * National Emergency Credit Facility Ceiling (LKR Millions).
 * The Ministry of Finance / Central Bank authorizes emergency overdraft borrowing up to LKR 200M.
 * Drawing below 0M triggers the fiscalInsolvency crisis penalty (-12 pts on CPS) and liquidity stress.
 * Exceeding LKR 200M debt triggers a hard sovereign borrowing halt.
 */
export const EMERGENCY_CREDIT_FACILITY_CAP = 200;

/**
 * Validates budget, credit facility, & fleet constraints for resource rounds (Buckets 3 & 4).
 */
export function validateConstraints(
  bucket: number, 
  decision: { rankings?: string[]; allocations?: Record<string, number> },
  currentBudget?: number
): { valid: boolean; error?: string } {
  // 0. Emergency Credit Facility Check (Ceiling = LKR 150M borrowing)
  if (currentBudget !== undefined) {
    let projectedDrain = 0;
    if (bucket === 3) {
      if (decision.allocations) {
        projectedDrain = Object.values(decision.allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
      } else if (decision.rankings && decision.rankings.length > 0 && decision.rankings[0] !== '3E') {
        projectedDrain = 100;
      }
    } else if (bucket === 4) {
      if (decision.rankings && decision.rankings.length > 0 && decision.rankings[0] === '4E') {
        projectedDrain = 0;
      } else {
        projectedDrain = 60; // LKR 60M mobilization fee
      }
    } else if (decision.rankings && decision.rankings.length > 0) {
      decision.rankings.slice(0, 3).forEach(actionId => {
        const action = findAction(actionId, bucket);
        if (action) {
          projectedDrain -= action.impacts.emergencyBudget;
        }
      });
    }
    if (currentBudget - projectedDrain < -EMERGENCY_CREDIT_FACILITY_CAP) {
      return {
        valid: false,
        error: `Action requires emergency borrowing exceeding the LKR ${EMERGENCY_CREDIT_FACILITY_CAP}M Emergency Credit Facility ceiling. Projected balance would reach LKR ${(currentBudget - projectedDrain).toFixed(0)}M.`
      };
    }
  }

  if (bucket === 3) {
    // If player selected a plan by ranking, reject if top choice is the invalid 3E
    if (decision.rankings && decision.rankings.length > 0) {
      const topAction = decision.rankings[0];
      if (topAction === '3E' || topAction === 'B3_ACT_5') {
        return {
          valid: false,
          error: 'Plan 3E releases LKR 120M and breaches the scenario-defined LKR 100M emergency allocation ceiling.'
        };
      }
    }
    // If player passed custom allocations across sectors
    if (decision.allocations) {
      const values = Object.values(decision.allocations).map(v => Number(v) || 0);
      if (values.some(v => v < 0)) {
        return { valid: false, error: 'Allocation amounts cannot be negative.' };
      }
      const total = values.reduce((sum, val) => sum + val, 0);
      if (total > 100.001) {
        return { 
          valid: false, 
          error: `Budget allocation of LKR ${total.toFixed(1)}M exceeds the scenario-defined LKR 100M emergency allocation ceiling.` 
        };
      }
    }
  } else if (bucket === 4) {
    if (decision.allocations) {
      const alloc = decision.allocations;
      const values = Object.values(alloc).map(v => Number(v) || 0);
      if (values.some(v => v < 0)) {
        return { valid: false, error: 'Fleet allocations cannot be negative.' };
      }

      // Per-vehicle pool constraints:
      // Heavy-duty Trucks: max 20 | Rescue Vehicles: max 30 | Rescue Boats: max 20
      const trucks = (Number(alloc['trucks_flood'] ?? alloc['trucksFlood'] ?? 0)) + 
                     (Number(alloc['trucks_dryzone'] ?? alloc['trucksDryZone'] ?? 0));
      if (trucks > 20) {
        return {
          valid: false,
          error: `Truck allocation (${trucks}) exceeds national fleet limit of 20 heavy-duty trucks.`
        };
      }

      const vehicles = (Number(alloc['vehicles_flood'] ?? alloc['vehiclesFlood'] ?? 0)) + 
                       (Number(alloc['vehicles_dryzone'] ?? alloc['vehiclesDryZone'] ?? 0));
      if (vehicles > 30) {
        return {
          valid: false,
          error: `Rescue vehicle allocation (${vehicles}) exceeds national fleet limit of 30 rescue vehicles.`
        };
      }

      const boats = (Number(alloc['boats_flood'] ?? alloc['boatsFlood'] ?? 0)) + 
                    (Number(alloc['boats_dryzone'] ?? alloc['boatsDryZone'] ?? 0));
      if (boats > 20) {
        return {
          valid: false,
          error: `Rescue boat allocation (${boats}) exceeds national fleet limit of 20 rescue boats.`
        };
      }

      // Generic unit fallback (if passing plan shares like 4A: 30, 4B: 25)
      const totalFleet = Object.values(alloc).reduce((sum, val) => sum + (Number(val) || 0), 0);
      if (trucks === 0 && vehicles === 0 && boats === 0 && totalFleet > 100.001) {
        return { 
          valid: false, 
          error: `Fleet deployment of ${totalFleet} units exceeds regional pool limit (100 units).` 
        };
      }
    }
  }

  return { valid: true };
}

/**
 * COMPOUND HAZARD EROSION PENALTIES (Per Bucket / Disaster Phase)
 * 
 * Clarification of Hazard Mechanics (Addressing Reviewer Feedback B):
 * - Environmental Hazard Severity: Tracks physical hazard crests in the field (rainfall surges,
 *   spillway volume, high heatwave evaporation), recorded in `state.risks.floodRisk` and `state.risks.droughtRisk`.
 * - Compounding Preparedness Erosion: As hazard severity peaks across the 10-day timeline, existing community
 *   resilience and physical defenses suffer ongoing erosion/degradation unless reinforced by timely player action.
 *   These negative values represent PREPAREDNESS EROSION PENALTIES (decay of passive defenses under acute weather stress).
 * - They do NOT represent decreasing hazard severity. A higher negative value indicates a more severe environmental stressor
 *   eroding community readiness faster.
 */
export const COMPOUND_HAZARD_EROSION_PENALTIES: Record<
  number, 
  { floodPreparednessDecay: number; droughtPreparednessDecay: number; communityTrustErosion: number }
> = {
  1: { floodPreparednessDecay: 0,   droughtPreparednessDecay: 0,   communityTrustErosion: 0 },  // Day 0: Baseline uncertainty
  2: { floodPreparednessDecay: -8,  droughtPreparednessDecay: -8,  communityTrustErosion: -2 }, // Day 2: 150mm heavy rain & ongoing dry-zone deficit
  3: { floodPreparednessDecay: -10, droughtPreparednessDecay: -12, communityTrustErosion: -3 }, // Day 4: Acute resource crunch (120M needs vs 100M cap)
  4: { floodPreparednessDecay: -12, droughtPreparednessDecay: -10, communityTrustErosion: -3 }, // Day 6: Major Kelani spill & emergency transport strain
  5: { floodPreparednessDecay: -14, droughtPreparednessDecay: -10, communityTrustErosion: -4 }, // Day 8: Landslides in Ratnapura/Kalutara & telecom failure
  6: { floodPreparednessDecay: -6,  droughtPreparednessDecay: -6,  communityTrustErosion: -2 }, // Day 10: Aftermath contamination & recovery backlog
};

/**
 * Calculates raw deltas from a player's submitted decision for a bucket.
 * Operational Rounds (1, 2, 5, 6): Real costs deducted + timing efficacy weights.
 * Resource Rounds (3, 4): Evaluated with constraint validation and allocation logic.
 */
export function calculateDelta(
  decision: { rankings?: ActionId[]; allocations?: Record<string, number> } | ActionId[], 
  bucketNumber: number = 1,
  currentState?: GameState
): DecisionDelta {
  const normDecision = Array.isArray(decision) ? { rankings: decision } : decision;
  const delta: DecisionDelta = {
    floodPreparedness: 0,
    droughtPreparedness: 0,
    emergencyBudget: 0,
    communityTrust: 0,
    informationQuality: 0,
    decisionQuality: 0,
    triggeredEvents: [],
    tradeoffs: []
  };

  const isAllocationRound = bucketNumber === 3 || bucketNumber === 4;

  if (isAllocationRound) {
    // -------------------------------------------------------------------------
    // BUCKET 3 & 4: CONSTRAINT-BASED ALLOCATION / PACKAGE SELECTION LOGIC
    // -------------------------------------------------------------------------
    if (bucketNumber === 3) {
      // Round 3: Allocating LKR 100M against LKR 120M of needs across 3 competing sectors:
      // 1. Evacuation Support (Kelani area) - requirement LKR 40M
      // 2. Drinking-Water Delivery (Dry Zone) - requirement LKR 50M
      // 3. Emergency Medical Supplies - requirement LKR 30M
      if (normDecision.allocations) {
        const alloc = normDecision.allocations;
        const spent: number = Object.values(alloc).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
        delta.emergencyBudget = -Math.min(100, spent);

        const evac = alloc['evacuation'] ?? alloc['evac'] ?? alloc['3A'] ?? 0;
        const water = alloc['drinkingWater'] ?? alloc['water'] ?? alloc['3B'] ?? 0;
        const medical = alloc['medicalSupplies'] ?? alloc['medical'] ?? alloc['3C'] ?? 0;

        delta.floodPreparedness += (evac / 40) * 16;
        delta.droughtPreparedness += (water / 50) * 18;
        
        // Healthcare and evacuation foster community trust
        delta.communityTrust += (evac / 40) * 6 + (water / 50) * 6 + (medical / 30) * 8;
        
        // If medical supplies are completely starved (0M), clinic stockouts cause acute dissatisfaction
        if (spent > 0 && medical === 0) {
          delta.communityTrust -= 10;
        }

        delta.informationQuality += 3;

        if (spent >= 90 && spent <= 100) {
          delta.decisionQuality = 10;
        } else if (spent < 70) {
          delta.decisionQuality = -6; // Severe under-utilization during acute emergency
        }
        delta.executedActionIds = Object.keys(normDecision.allocations);
      } else if (normDecision.rankings && normDecision.rankings.length > 0) {
        // Selection of pre-formulated package (3A, 3D, 3C, 3B, 3E)
        // Exactly ONE package executes based on top rank!
        const topPackageId = normDecision.rankings[0];
        delta.executedActionIds = [topPackageId];
        const action = findAction(topPackageId, 3);
        if (action) {
          delta.emergencyBudget = action.impacts.emergencyBudget; // -100M
          delta.floodPreparedness += action.impacts.floodPreparedness;
          delta.droughtPreparedness += action.impacts.droughtPreparedness;
          delta.communityTrust += action.impacts.communityTrust;
          delta.informationQuality += action.impacts.informationQuality;
          delta.decisionQuality = Math.max(-10, 12 - 2 * (action.recommendedRank - 1));
        }
      }
    } else if (bucketNumber === 4) {
      // Round 4: Allocating emergency fleet (20 Trucks, 30 Rescue Vehicles, 20 Boats)
      // Standard logistical mobilization fee: LKR 60M exactly once
      if (normDecision.allocations) {
        delta.executedActionIds = ['CUSTOM_FLEET'];
        const alloc = normDecision.allocations;
        
        const trucksFlood = alloc['trucks_flood'] ?? alloc['trucksFlood'] ?? 0;
        const trucksDry = alloc['trucks_dryzone'] ?? alloc['trucksDryZone'] ?? 0;
        const vehiclesFlood = alloc['vehicles_flood'] ?? alloc['vehiclesFlood'] ?? 0;
        const vehiclesDry = alloc['vehicles_dryzone'] ?? alloc['vehiclesDryZone'] ?? 0;
        const boatsFlood = alloc['boats_flood'] ?? alloc['boatsFlood'] ?? 0;
        const boatsDry = alloc['boats_dryzone'] ?? alloc['boatsDryZone'] ?? 0;

        const hasVehicleKeys = (trucksFlood + trucksDry + vehiclesFlood + vehiclesDry + boatsFlood + boatsDry) > 0;

        delta.emergencyBudget = -60; // Standard logistical mobilization and deployment cost

        if (hasVehicleKeys) {
          // Optimal asset-to-task matching:
          // Boats only operate in flood waters; trucks haul bulk water tankers to Dry Zone
          delta.floodPreparedness += (boatsFlood / 20) * 10 + (vehiclesFlood / 30) * 6 + (trucksFlood / 20) * 4;
          delta.droughtPreparedness += (trucksDry / 20) * 12 + (vehiclesDry / 30) * 4;
          
          // Misallocation penalty: sending boats to dry zone wastes assets on dry ground
          if (boatsDry > 5) {
            delta.communityTrust -= 6;
          } else {
            delta.communityTrust += (vehiclesFlood / 30) * 5 + (trucksDry / 20) * 5;
          }
          delta.informationQuality += 2;
          delta.decisionQuality = 8;
        } else {
          // Support package IDs / generic distribution (4A, 4B, 4C, etc.)
          const plan4A = alloc['4A'] || 0;
          const plan4B = alloc['4B'] || 0;
          const plan4C = alloc['4C'] || 0;
          const plan4D = alloc['4D'] || 0;
          const plan4E = alloc['4E'] || 0;

          delta.floodPreparedness += (plan4A / 30) * 14 + (plan4D / 30) * 18 + (plan4B / 30) * 13;
          delta.droughtPreparedness += (plan4A / 30) * 10 + (plan4B / 30) * 11 + (plan4C / 30) * 6 - (plan4D / 30) * 10;
          delta.communityTrust += (plan4A / 30) * 8 + (plan4B / 30) * 4 - (plan4E / 30) * 10;
          delta.informationQuality += 2;
          delta.decisionQuality = 8;
        }
      } else if (normDecision.rankings && normDecision.rankings.length > 0) {
        // Selection of pre-formulated fleet package (4A, 4B, 4C, 4D, 4E)
        // Exactly ONE package executes based on top rank!
        const topFleetId = normDecision.rankings[0];
        delta.executedActionIds = [topFleetId];
        const action = findAction(topFleetId, 4);
        if (action) {
          delta.emergencyBudget = action.impacts.emergencyBudget; // -60M (or 0 for 4E)
          delta.floodPreparedness += action.impacts.floodPreparedness;
          delta.droughtPreparedness += action.impacts.droughtPreparedness;
          delta.communityTrust += action.impacts.communityTrust;
          delta.informationQuality += action.impacts.informationQuality;
          delta.decisionQuality = Math.max(-10, 12 - 2 * (action.recommendedRank - 1));
        }
      }
    }
  } else {
    // -------------------------------------------------------------------------
    // BUCKETS 1, 2, 5, 6: OPERATIONAL PRIORITY RANKING
    // -------------------------------------------------------------------------
    const rankings: ActionId[] = normDecision.rankings || [];
    delta.executedActionIds = rankings.slice(0, 3);
    let totalRankDistance = 0;

    rankings.forEach((actionId, index) => {
      const action = findAction(actionId, bucketNumber);
      if (!action) return;

      const playerRank = index + 1;
      totalRankDistance += Math.abs(playerRank - action.recommendedRank);

      // In real crisis response, top 3 ranked actions are the active commitments mobilized
      // during the 48-hour disaster cycle. Ranks 4 & 5 represent deprioritized/deferred actions.
      if (index < 3) {
        // Active execution:
        // Rank 1: Immediate primary action (100% efficacy, 100% real financial cost)
        // Rank 2: Rapid secondary deployment (85% efficacy, 100% real financial cost)
        // Rank 3: Tertiary contingency measure (70% efficacy, 100% real financial cost)
        const efficacy = EXECUTION_EFFICACY_WEIGHTS[index] ?? 0.70;

        delta.emergencyBudget += action.impacts.emergencyBudget;
        delta.floodPreparedness += action.impacts.floodPreparedness * efficacy;
        delta.droughtPreparedness += action.impacts.droughtPreparedness * efficacy;
        delta.communityTrust += action.impacts.communityTrust * efficacy;
        delta.informationQuality += action.impacts.informationQuality * efficacy;
      } else {
        // Deprioritized actions (Ranks 4 & 5):
        // Not mobilized in this cycle -> real financial cost is 0 (savings preserved).
        // Critical omission penalty: If a vital life-safety action (recommended rank 1)
        // is omitted or buried, downstream communities suffer preventable harm.
        if (action.recommendedRank === 1) {
          delta.floodPreparedness -= 8;
          delta.communityTrust -= 6;
          delta.decisionQuality -= 4;
        }
      }
    });

    // Decision Quality: reflects proximity to sound crisis doctrine
    delta.decisionQuality = Math.max(-15, Math.min(15, 12 - 2 * totalRankDistance));
  }

  // -------------------------------------------------------------------------
  // COMPOUND HAZARD EROSION & ADAPTIVE REGIME DYNAMICS
  // Reflects the physical degradation of unreinforced defenses under escalating weather
  // -------------------------------------------------------------------------
  const baseDecay = COMPOUND_HAZARD_EROSION_PENALTIES[bucketNumber] || { 
    floodPreparednessDecay: 0, 
    droughtPreparednessDecay: 0, 
    communityTrustErosion: 0 
  };

  let floodDecay = baseDecay.floodPreparednessDecay;
  let droughtDecay = baseDecay.droughtPreparednessDecay;
  let trustDecay = baseDecay.communityTrustErosion;

  // Contextual Sensitivity: Evaluate initial hazard regime
  if (currentState) {
    const floodRisk = currentState.risks?.floodRisk ?? 50;
    const droughtRisk = currentState.risks?.droughtRisk ?? 50;

    // Severe Flood-Dominant Regime (floodRisk >= 65 and droughtRisk < 45)
    // Torrential deluge accelerates flood erosion; flood adaptations yield high returns
    if (floodRisk >= 65 && droughtRisk < 45) {
      floodDecay -= 4;     // Additional acute flood erosion penalty
      droughtDecay += 4;   // Drought stress relieved by rainfall
      if (delta.floodPreparedness > 0) {
        delta.floodPreparedness *= 1.15; // +15% adaptation bonus for flood defense
      }
    }
    // Severe Drought-Dominant Regime (droughtRisk >= 65 and floodRisk < 45)
    // Acute heatwave accelerates water depletion; water conservation yields high returns
    else if (droughtRisk >= 65 && floodRisk < 45) {
      droughtDecay -= 4;   // Additional acute drought erosion penalty
      floodDecay += 4;     // Flood danger subdued
      if (delta.droughtPreparedness > 0) {
        delta.droughtPreparedness *= 1.15; // +15% adaptation bonus for drought defense
      }
    }
  }

  delta.floodPreparedness += floodDecay;
  delta.droughtPreparedness += droughtDecay;
  delta.communityTrust += trustDecay;

  // -------------------------------------------------------------------------
  // INTER-ROUND DYNAMIC EVENTS INJECTION
  // -------------------------------------------------------------------------
  if (currentState) {
    const dynamicEvents = evaluateDynamicInterRoundEvents(currentState);
    delta.triggeredEvents = dynamicEvents;

    dynamicEvents.forEach(evt => {
      if (evt.effects.floodPreparedness) delta.floodPreparedness += evt.effects.floodPreparedness;
      if (evt.effects.droughtPreparedness) delta.droughtPreparedness += evt.effects.droughtPreparedness;
      if (evt.effects.emergencyBudget) delta.emergencyBudget += evt.effects.emergencyBudget;
      if (evt.effects.communityTrust) delta.communityTrust += evt.effects.communityTrust;
      if (evt.effects.informationQuality) delta.informationQuality += evt.effects.informationQuality;
    });
  }

  return delta;
}

/**
 * Applies a player's decision to the current GameState, mutating scores, resources,
 * community, and telemetry synchronously and advancing the timeline.
 */
export function processDecision(
  state: GameState,
  userId: string,
  decision: { rankings?: ActionId[]; allocations?: Record<string, number> } | ActionId[]
): GameState {
  const normDecision = Array.isArray(decision) ? { rankings: decision } : decision;

  // Validate constraints for resource rounds and Emergency Credit Facility
  const constraintCheck = validateConstraints(state.bucket, normDecision, state.resources?.emergencyBudget);
  if (!constraintCheck.valid) {
    throw new Error(constraintCheck.error || 'Decision violates operational constraints.');
  }

  const delta = calculateDelta(normDecision, state.bucket, state);
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  // 1. Update Core Preparedness Scores (Clamped 0 to 100)
  newState.scores.floodPreparedness = Math.max(
    0,
    Math.min(100, Math.round(newState.scores.floodPreparedness + delta.floodPreparedness))
  );

  newState.scores.droughtPreparedness = Math.max(
    0,
    Math.min(100, Math.round(newState.scores.droughtPreparedness + delta.droughtPreparedness))
  );

  // 2. Real Treasury Balance (LKR Millions) - tracks emergency borrowing and debt deficit below zero
  newState.resources.emergencyBudget =
    Math.round((newState.resources.emergencyBudget + delta.emergencyBudget) * 10) / 10;

  // Fiscal Health / Resource Score based on budget remaining from initial 500M
  const budgetRatio = newState.resources.emergencyBudget / 500;
  newState.scores.resourceScore = Math.max(0, Math.min(100, Math.round(budgetRatio * 100)));

  // 3. Update Community Trust
  newState.community.communityTrust = Math.max(
    0,
    Math.min(100, Math.round(newState.community.communityTrust + delta.communityTrust))
  );
  newState.scores.communityTrust = newState.community.communityTrust;

  // 4. Update Information Quality
  newState.information.informationQuality = Math.max(
    0,
    Math.min(100, Math.round(newState.information.informationQuality + delta.informationQuality))
  );
  newState.scores.informationQuality = newState.information.informationQuality;

  // 5. Update Decision Quality
  newState.scores.decisionQuality = Math.max(
    0,
    Math.min(100, Math.round(newState.scores.decisionQuality + delta.decisionQuality))
  );

  // 6. Lifeline Operations Synchronization
  newState.operations.communication = newState.information.informationQuality;
  newState.resources.drinkingWater = Math.max(5, Math.min(100, Math.round(newState.scores.droughtPreparedness)));
  newState.resources.agriculturalWater = Math.max(5, Math.min(100, Math.round(newState.scores.droughtPreparedness * 0.9)));
  newState.risks.floodRisk = Math.max(5, Math.min(95, 100 - newState.scores.floodPreparedness));
  newState.risks.droughtRisk = Math.max(5, Math.min(95, 100 - newState.scores.droughtPreparedness));

  // 7. Dynamic Events Tracking
  newState.activeDynamicEvents = delta.triggeredEvents || [];

  // 8. Record in Decision History
  newState.decisionHistory.push({
    bucket: state.bucket,
    day: state.day,
    userId,
    rankings: normDecision.rankings,
    allocations: normDecision.allocations,
    executedActionIds: delta.executedActionIds,
    triggeredEvents: delta.triggeredEvents?.map(e => e.id),
    timestamp: new Date()
  });

  // 9. Advance Bucket & Day
  newState.bucket += 1;
  newState.day = (newState.bucket - 1) * 2;

  return newState;
}

/**
 * Returns the scenario data for a given bucket index (1 to 6).
 */
export function determineScenarioForBucket(bucket: number): BucketScenario | null {
  return SCENARIOS[bucket] || null;
}

/**
 * Calculates final Composite Preparedness Score (CPS), failure threshold checks,
 * ending tier classifications, and strategic multi-criteria trade-off debrief.
 */
export function calculateFinalOutcome(state: GameState): FinalResult {
  const {
    floodPreparedness,
    droughtPreparedness,
    resourceScore,
    informationQuality,
    communityTrust,
    decisionQuality
  } = state.scores;

  const emergencyBudget = state.resources.emergencyBudget;

  // ---------------------------------------------------------------------------
  // EXPLICIT FAILURE THRESHOLDS (CRISIS CONDITIONS)
  // ---------------------------------------------------------------------------
  const failureStates: FailureStates = {
    fiscalInsolvency: emergencyBudget <= 0,
    catastrophicInundation: floodPreparedness < 35,
    droughtShock: droughtPreparedness < 30,
    civilBreakdown: communityTrust < 25
  };

  const breachedFailuresCount = Object.values(failureStates).filter(Boolean).length;

  // Multi-pillar weighted preparedness baseline:
  // Multi-pillar weighted preparedness baseline:
  // Flood Preparedness: 25%
  // Drought Preparedness: 25%
  // Fiscal / Resource Discipline: 20%
  // Information Quality: 15%
  // Community Trust: 15%
  const baselineWeightedSum = Math.round(
    (0.25 * floodPreparedness +
     0.25 * droughtPreparedness +
     0.20 * resourceScore +
     0.15 * informationQuality +
     0.15 * communityTrust) * 10
  ) / 10;

  // Failure penalties: -12 points per breached crisis condition
  const failurePenaltyPoints = breachedFailuresCount * 12;
  const scoreAfterPenalties = Math.max(10, Math.round((baselineWeightedSum - failurePenaltyPoints) * 10) / 10);
  const cps = Math.max(0, Math.min(100, scoreAfterPenalties));

  const pathway: ScenarioOutcome = droughtPreparedness < floodPreparedness ? 'Flood' : 'Drought';

  // ---------------------------------------------------------------------------
  // ENDING TIERS CLASSIFICATION (COMPLETE 4-STEP DECISION SEQUENCE WATERFALL)
  // Evaluated strictly in order so crisis states cannot be overridden by raw scores:
  // 1. Two or more failure states, OR CPS < 40 -> Tier 4: Systemic Crisis
  // 2. Exactly one failure state, OR CPS < 65  -> Tier 3: Pyrrhic Survival
  // 3. CPS >= 80, zero failures, Decision Quality >= 65 -> Tier 1: Exemplary Climate Resilience
  // 4. All remaining outcomes (zero failures, CPS >= 65) -> Tier 2: Competent Emergency Response
  //    (Covers 65 <= CPS < 80 with 0 failures, as well as CPS >= 80 with Decision Quality < 65 and 0 failures)
  // ---------------------------------------------------------------------------
  let endingTier: EndingTier;
  let rating: PreparednessRating;

  if (breachedFailuresCount >= 2 || cps < 40) {
    endingTier = 'Tier 4: Systemic Crisis';
    rating = 'Critical';
  } else if (breachedFailuresCount === 1 || cps < 65) {
    endingTier = 'Tier 3: Pyrrhic Survival';
    rating = cps >= 50 ? 'Moderate' : 'Poor';
  } else if (cps >= 80 && breachedFailuresCount === 0 && decisionQuality >= 65) {
    endingTier = 'Tier 1: Exemplary Climate Resilience';
    rating = 'Excellent';
  } else {
    endingTier = 'Tier 2: Competent Emergency Response';
    rating = 'Good';
  }

  // ---------------------------------------------------------------------------
  // TRADE-OFFS & DEBRIEF NARRATIVE
  // ---------------------------------------------------------------------------
  const tradeoffs: string[] = [];

  if (floodPreparedness >= 75 && droughtPreparedness < 45) {
    tradeoffs.push('Flood-Biased Protection: Kelani flood basin secured, but aggressive reservoir releases induced dry-zone water stress.');
  } else if (droughtPreparedness >= 75 && floodPreparedness < 45) {
    tradeoffs.push('Water Hoarding Shock: Maximum water storage maintained for drought, at the expense of severe downstream river overflow.');
  } else if (floodPreparedness >= 65 && droughtPreparedness >= 65) {
    if (emergencyBudget <= 0) {
      tradeoffs.push('Water Management vs Fiscal Trade-off: High flood buffering and drought storage were achieved, but at the cost of severe capital exhaustion and unsustainable emergency expenditure.');
    } else {
      tradeoffs.push('Harmonized Water Management: Exemplary balance between flood buffering and long-term agrarian storage.');
    }
  }

  if (emergencyBudget > 250) {
    tradeoffs.push(`Fiscal Conservatism: Retained LKR ${Math.round(emergencyBudget)}M in reserves; prudent fiscal buffer maintained.`);
  } else if (emergencyBudget <= 0) {
    const debt = Math.abs(Math.round(emergencyBudget));
    const avail = Math.max(0, EMERGENCY_CREDIT_FACILITY_CAP - debt);
    tradeoffs.push(
      `Emergency Credit Utilization: Treasury in deficit with LKR ${debt}M drawn from the Emergency Credit Facility (LKR ${avail}M capacity remaining of LKR ${EMERGENCY_CREDIT_FACILITY_CAP}M facility). Operating on emergency borrowing incurred the sovereign fiscal solvency deduction.`
    );
  } else if (emergencyBudget <= 40) {
    tradeoffs.push(`Treasury Exhaustion: Spent aggressively (LKR ${Math.round(emergencyBudget)}M remaining), creating severe post-disaster liquidity risk.`);
  }

  if (communityTrust >= 75) {
    tradeoffs.push('Strong Civic Trust: Clear communication and participatory camp logistics earned high public cooperation.');
  } else if (communityTrust < 40) {
    tradeoffs.push('Public Disillusionment: Conflicting warnings and slow supply distribution degraded civic compliance.');
  }

  // ---------------------------------------------------------------------------
  // DETAILED SCORE CALCULATION & AUDIT BREAKDOWN
  // ---------------------------------------------------------------------------
  const weightedComponents = [
    { label: 'Flood Resilience', rawScore: Math.round(floodPreparedness), weightPercent: 25, contribution: Math.round(0.25 * floodPreparedness * 10) / 10 },
    { label: 'Drought Resilience', rawScore: Math.round(droughtPreparedness), weightPercent: 25, contribution: Math.round(0.25 * droughtPreparedness * 10) / 10 },
    { label: 'Fiscal Management', rawScore: Math.round(resourceScore), weightPercent: 20, contribution: Math.round(0.20 * resourceScore * 10) / 10 },
    { label: 'Information Quality', rawScore: Math.round(informationQuality), weightPercent: 15, contribution: Math.round(0.15 * informationQuality * 10) / 10 },
    { label: 'Community Trust', rawScore: Math.round(communityTrust), weightPercent: 15, contribution: Math.round(0.15 * communityTrust * 10) / 10 },
  ];

  const curveAdjustment = 0;

  const arithmeticMean = Math.round(
    ((floodPreparedness + droughtPreparedness + resourceScore + informationQuality + communityTrust + decisionQuality) / 6) * 10
  ) / 10;

  const calculationDetails: ScoreCalculationDetails = {
    weightedComponents,
    baselineWeightedSum,
    breachedFailuresCount,
    failurePenaltyPoints,
    scoreAfterPenalties,
    curveAdjustment: 0,
    finalCps: cps,
    arithmeticMean,
    explanation: breachedFailuresCount > 0
      ? `Weighted baseline (${baselineWeightedSum}) minus ${failurePenaltyPoints} pts from ${breachedFailuresCount} crisis failure condition(s) yields ${cps} pts.`
      : `Weighted baseline is ${baselineWeightedSum} pts with zero crisis penalties.`
  };

  // ---------------------------------------------------------------------------
  // EXECUTIVE MISSION ANALYSIS NARRATIVE
  // Accurately reflects the specific combination of failure states and CPS
  // ---------------------------------------------------------------------------
  let summary = '';
  if (endingTier === 'Tier 1: Exemplary Climate Resilience') {
    summary = 'Outstanding multi-hazard crisis leadership. Your strategic balance of rapid telemetry, disciplined capital allocation, and balanced reservoir control protected life and public trust across both the Kelani flood basin and the Dry Zone without exhausting provincial reserves.';
  } else if (endingTier === 'Tier 2: Competent Emergency Response') {
    summary = 'Competent disaster response. Frontline teams prevented catastrophic dam failure and maintained key lifelines, though minor trade-offs between flood mitigation and drought storage surfaced.';
  } else if (endingTier === 'Tier 3: Pyrrhic Survival') {
    if (failureStates.fiscalInsolvency) {
      summary = 'Pyrrhic survival achieved. Strong flood resilience, drought preparedness and information quality could not offset the exhaustion of the emergency treasury. The administration maintained operational capacity but lost the financial reserves needed to sustain further response and recovery operations.';
    } else if (failureStates.catastrophicInundation) {
      summary = 'Pyrrhic survival achieved. Provincial finances and dry-zone supplies held, but severe flood defense breaches in the Kelani basin caused widespread residential inundation and infrastructure damage.';
    } else if (failureStates.droughtShock) {
      summary = 'Pyrrhic survival achieved. Floodwaters were repelled and the treasury survived, but dry-zone reservoir storage collapsed into acute drought shock, devastating regional agriculture and irrigation.';
    } else if (failureStates.civilBreakdown) {
      summary = 'Pyrrhic survival achieved. Physical infrastructure remained operational, but severe community disillusionment and non-compliance crippled emergency relief logistics and civic trust.';
    } else {
      summary = 'Pyrrhic survival achieved. Catastrophic casualties were avoided, but a critical failure state emerged—either severe treasury exhaustion, public disillusionment, or post-flood dry-zone agricultural water collapse.';
    }
  } else {
    // Tier 4: Systemic Crisis
    if (breachedFailuresCount >= 2) {
      summary = 'Systemic disaster crisis. Compounding hazards overwhelmed the provincial coordination mechanism. Multiple failure thresholds were breached, requiring emergency national intervention and external reconstruction aid.';
    } else if (breachedFailuresCount === 1) {
      if (failureStates.fiscalInsolvency) {
        summary = 'Systemic disaster crisis. The emergency treasury was exhausted, and the Composite Preparedness Score fell below the critical survival threshold. Although flood defences, drought resilience, information quality and community trust retained varying levels of operational capacity, the loss of financial reserves left the administration vulnerable to continuing emergency demands and recovery costs.';
      } else if (failureStates.catastrophicInundation) {
        summary = 'Systemic disaster crisis. Severe flood defense failure in the Kelani basin coincided with a Composite Preparedness Score below the critical survival threshold. Despite retaining capacity in other sectors, catastrophic inundation crippled provincial emergency operations.';
      } else if (failureStates.droughtShock) {
        summary = 'Systemic disaster crisis. Acute dry-zone water storage collapse coincided with a Composite Preparedness Score below the critical survival threshold. Despite avoiding other immediate collapses, catastrophic agricultural drought overwhelmed regional stability.';
      } else {
        summary = 'Systemic disaster crisis. Civic breakdown and loss of community trust coincided with a Composite Preparedness Score below the critical survival threshold. Despite retaining physical resources, the complete loss of public cooperation paralyzed disaster management.';
      }
    } else {
      // 0 breached failures, but CPS < 40
      summary = 'Systemic disaster crisis. While no single crisis threshold collapsed completely, widespread cross-pillar degradation drove the Composite Preparedness Score below the critical survival threshold. Fragile defenses across all sectors left the province vulnerable to escalating compound disaster impacts.';
    }
  }

  return {
    cps,
    pathway,
    rating,
    endingTier,
    failureStates,
    breakdown: {
      floodPreparedness,
      droughtPreparedness,
      resourceScore,
      informationQuality,
      communityTrust,
      decisionQuality
    },
    tradeoffs,
    summary,
    calculationDetails
  };
}

// Backwards-compatible initial state getter
export const getInitialState = getInitialGameState;
