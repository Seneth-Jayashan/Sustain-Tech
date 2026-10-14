import { 
  ActionId, FinalResult, PreparednessRating, ScenarioOutcome, 
  EndingTier, FailureStates, DynamicEventTrigger, Action,
  ScoreCalculationDetails, TpiComponent, TpiCalculationDetails, SimulationMode
} from './types';
import { ACTION_MATRIX } from './matrix';
import { SCENARIOS, BucketScenario } from './scenario';
import { GameState, getInitialGameState } from './state';
import { getRoundDuration, getDefaultBucketShuffledOrder } from './timer';

export const FALLBACK_INTERVENTION_PENALTY_PER_ROUND = 10; // Documented deduction of 10 points per fallback intervention


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
    if (state.resources.emergencyBudget <= 0) {
      events.push({
        id: 'FISCAL_STRESS_LIQUIDITY',
        title: 'Provincial Treasury Exhaustion',
        description: 'Treasury reserves dipped into deficit. Response operations are drawing on the Emergency Credit Facility, delaying commercial contractor procurements.',
        impactType: 'negative',
        effects: {
          floodPreparedness: -6,
          communityTrust: -4,
        }
      });
    } else if (state.resources.emergencyBudget <= 60) {
      events.push({
        id: 'FISCAL_STRESS_LIQUIDITY',
        title: 'Treasury Liquidity Stress',
        description: `Only LKR ${Math.round(state.resources.emergencyBudget)}M remains from the initial LKR 500M treasury. Review recovery commitments carefully to preserve funds for essential repairs and ongoing emergency needs.`,
        impactType: 'warning',
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
      } else if (decision.rankings && decision.rankings.length > 0) {
        const top = decision.rankings[0];
        projectedDrain = (top === '3E' || top === 'B3_ACT_5') ? 120 : 100;
      }
    } else if (bucket === 4) {
      if (decision.rankings && decision.rankings.length > 0 && (decision.rankings[0] === '4E' || decision.rankings[0] === 'B4_ACT_5')) {
        projectedDrain = 0;
      } else if (decision.allocations) {
        const alloc = decision.allocations;
        const totalUnits = (Number(alloc['trucks_flood'] ?? alloc['trucksFlood'] ?? 0)) +
                           (Number(alloc['trucks_dryzone'] ?? alloc['trucksDryZone'] ?? 0)) +
                           (Number(alloc['vehicles_flood'] ?? alloc['vehiclesFlood'] ?? 0)) +
                           (Number(alloc['vehicles_dryzone'] ?? alloc['vehiclesDryZone'] ?? 0)) +
                           (Number(alloc['boats_flood'] ?? alloc['boatsFlood'] ?? 0)) +
                           (Number(alloc['boats_dryzone'] ?? alloc['boatsDryZone'] ?? 0));
        projectedDrain = totalUnits > 0 ? 60 : 0;
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
        if (normDecision.rankings && normDecision.rankings.length > 0) {
          delta.executedActionIds = [normDecision.rankings[0]];
        } else {
          delta.executedActionIds = Object.keys(normDecision.allocations);
        }
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
        
        const trucksFlood = Number(alloc['trucks_flood'] ?? alloc['trucksFlood'] ?? 0);
        const trucksDry = Number(alloc['trucks_dryzone'] ?? alloc['trucksDryZone'] ?? 0);
        const vehiclesFlood = Number(alloc['vehicles_flood'] ?? alloc['vehiclesFlood'] ?? 0);
        const vehiclesDry = Number(alloc['vehicles_dryzone'] ?? alloc['vehiclesDryZone'] ?? 0);
        const boatsFlood = Number(alloc['boats_flood'] ?? alloc['boatsFlood'] ?? 0);
        const boatsDry = Number(alloc['boats_dryzone'] ?? alloc['boatsDryZone'] ?? 0);

        const totalUnits = trucksFlood + trucksDry + vehiclesFlood + vehiclesDry + boatsFlood + boatsDry;
        const hasVehicleKeys = ['trucks_flood', 'trucks_dryzone', 'vehicles_flood', 'vehicles_dryzone', 'boats_flood', 'boats_dryzone', 'trucksFlood', 'trucksDryZone', 'vehiclesFlood', 'vehiclesDryZone', 'boatsFlood', 'boatsDryZone'].some(k => k in alloc);

        if (hasVehicleKeys) {
          if (totalUnits > 0) {
            delta.emergencyBudget = -60; // Standard logistical mobilization and deployment cost
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
            // Holding all resources in reserve costs LKR 0M (same as Plan 4E)
            delta.emergencyBudget = 0;
            delta.floodPreparedness -= 8;
            delta.droughtPreparedness -= 8;
            delta.communityTrust -= 10;
            delta.informationQuality -= 2;
            delta.decisionQuality = 4;
          }
        } else {
          // Support package IDs / generic distribution (4A, 4B, 4C, etc.)
          const plan4A = alloc['4A'] || 0;
          const plan4B = alloc['4B'] || 0;
          const plan4C = alloc['4C'] || 0;
          const plan4D = alloc['4D'] || 0;
          const plan4E = alloc['4E'] || 0;

          delta.emergencyBudget = (plan4E > 0 && plan4A === 0 && plan4B === 0 && plan4C === 0 && plan4D === 0) ? 0 : -60;
          delta.floodPreparedness += (plan4A / 30) * 14 + (plan4D / 30) * 18 + (plan4B / 30) * 13;
          delta.droughtPreparedness += (plan4A / 30) * 10 + (plan4B / 30) * 11 + (plan4C / 30) * 6 - (plan4D / 30) * 10;
          delta.communityTrust += (plan4A / 30) * 8 + (plan4B / 30) * 4 - (plan4E / 30) * 10;
          delta.informationQuality += 2;
          delta.decisionQuality = 8;
        }
        if (normDecision.rankings && normDecision.rankings.length > 0) {
          delta.executedActionIds = [normDecision.rankings[0]];
        } else {
          delta.executedActionIds = Object.keys(normDecision.allocations);
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
  const trustDecay = baseDecay.communityTrustErosion;

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
 * Generates an emergency fallback decision if the deliberation countdown expires.
 * - For operational rounds (1, 2, 5, 6): preserves user ranks if partially chosen, fills remaining with canonical actions.
 * - For Day 4 (3): if no valid preset or custom allocation, falls back to standard Plan 3A.
 * - For Day 6 (4): if no valid fleet preset or custom allocation, falls back to standard Plan 4A.
 */
export interface FallbackPolicyDetails {
  roundName: string;
  planOrActions: string;
  explanation: string;
  executedActionTitles: string[];
  netBudgetImpact: number;
}

/**
 * Authoritative, documented fallback strategies for Tournament Mode across all 6 rounds.
 * Deterministic poor-response contingency policies modeling realistic consequences
 * of command inaction (delayed warnings, poor verification, neglected critical needs,
 * and unserved rescue operations) while strictly respecting the 100M Day 4 cap,
 * fleet limits, and the LKR 200M emergency credit facility ceiling.
 */
export const AUTHORITATIVE_FALLBACK_POLICIES = {
  1: {
    roundName: 'Day 0 — Early Warning and Uncertainty',
    rankings: ['1E', '1D', '1A', '1C', '1B'],
    top3Actions: ['1E', '1D', '1A'],
    totalCost: 15, // 0 + 5 + 10
    rationale: 'Contingency holding action: Delayed operational decisions (1E) while issuing late general advisories (1D) and limited baseline checks (1A). Left critical drainage channels (1C) uncleared, delaying early flood mitigation.'
  },
  2: {
    roundName: 'Day 2 — Compound Hazard',
    rankings: ['2D', '2A', '2B', '2E', '2C'],
    top3Actions: ['2D', '2A', '2B'],
    totalCost: 10, // 0 + 2 + 8
    rationale: 'Contingency holding action: Delayed activation until severe flooding (2D) and relied on unverified social feeds (2A) alongside minimal official checks (2B). Omitted comprehensive monitoring network (2E), degrading information quality and public trust.'
  },
  3: {
    roundName: 'Day 4 — Fiscal Allocation',
    defaultPlan: '3B',
    defaultAllocations: { evacuation: 60, drinkingWater: 40, medicalSupplies: 0 },
    defaultCost: 100,
    rationale: 'Contingency holding action: Inadequate allocation Plan 3B (Evac 60M, Water 40M, Medical 0M) completely starves emergency medical supplies, causing acute clinic stockouts and public distress.'
  },
  4: {
    roundName: 'Day 6 — Emergency Fleet Distribution',
    primaryPlan: '4E',
    reservePlan: '4E',
    cost: 0,
    rationale: 'Contingency holding action: Fleet held in depot reserves (Plan 4E) at LKR 0M cost. Left flood rescue and dry-zone water operations unserved during the critical surge window, severely eroding civic trust and survival margins.'
  },
  5: {
    roundName: 'Day 8 — Crisis Escalation',
    solventRankings: ['5D', '5C', '5E', '5A', '5B'],
    constrainedRankings: ['5D', '5C', '5E', '5A', '5B'],
    totalCost: -30, // 0 + 30 - 60 = -30M net spend (+30M gain)
    rationale: 'Contingency holding action: Evacuate only residents who volunteer (5D) while setting up minimal triage (5C) and freezing auxiliary budgets (5E). Omitted mandatory evacuation in high-risk landslide zones (5A), leading to severe preventable casualties.'
  },
  6: {
    roundName: 'Day 10 — Recovery & Rehabilitation',
    solventRankings: ['6D', '6A', '6E', '6B', '6C'],
    constrainedRankings: ['6D', '6A', '6E', '6B', '6C'],
    totalCost: -35, // 0 + 15 - 50 = -35M net spend (+35M gain)
    rationale: 'Contingency holding action: Enforced harsh uniform rationing without reassessing community needs (6D) while executing minimal PDNA (6A) and donor matching (6E). Omitted disease surveillance (6C) and infrastructure reconstruction (6B), sparking public resentment.'
  }
};

/**
 * Generates an emergency fallback decision if the deliberation countdown expires in Tournament Mode.
 * Implements deterministic, poor-response contingency policies for each of the six rounds:
 * - Day 0: Delayed warning action (1E) prioritized, drainage clearing omitted.
 * - Day 2: Delayed response (2D) and rumor dependency (2A) prioritized.
 * - Day 4: Inadequate Plan 3B (60M evac, 40M water, 0M medical) starving critical healthcare.
 * - Day 6: Plan 4E holding all rescue vehicles and boats in depot reserves (0M cost), leaving rescue unserved.
 * - Day 8: Voluntary-only evacuation (5D) prioritized, neglecting mandatory life-safety evacuation (5A).
 * - Day 10: Harsh food/water rationing (6D) prioritized without reassessing surviving community needs.
 * Always respects the 100M Day 4 cap, fleet limits, and the LKR 200M emergency credit facility ceiling.
 */
export function createFallbackDecision(
  bucket: number,
  partialDecision?: { rankings?: ActionId[]; allocations?: Record<string, number> },
  currentBudget?: number
): {
  decision: { rankings?: ActionId[]; allocations?: Record<string, number> };
  emergencyFallback: boolean;
  policyDetails: FallbackPolicyDetails;
} {
  const norm = partialDecision || {};
  const budget = currentBudget ?? 400;

  // ---------------------------------------------------------------------------
  // Day 4 (Bucket 3): Fiscal Allocation
  // ---------------------------------------------------------------------------
  if (bucket === 3) {
    // If player had entered a valid custom allocation within budget, preserve it
    if (norm.allocations && typeof norm.allocations === 'object') {
      const sum = (Number(norm.allocations.evacuation) || 0) +
                  (Number(norm.allocations.drinkingWater) || 0) +
                  (Number(norm.allocations.medicalSupplies) || 0);
      const hasNegative = (Number(norm.allocations.evacuation) < 0) ||
                          (Number(norm.allocations.drinkingWater) < 0) ||
                          (Number(norm.allocations.medicalSupplies) < 0);
      if (sum > 0 && sum <= 100 && !hasNegative && (budget - sum >= -EMERGENCY_CREDIT_FACILITY_CAP)) {
        return {
          decision: norm,
          emergencyFallback: false,
          policyDetails: {
            roundName: AUTHORITATIVE_FALLBACK_POLICIES[3].roundName,
            planOrActions: `Custom Allocation (Evac ${norm.allocations.evacuation}M, Water ${norm.allocations.drinkingWater}M, Med ${norm.allocations.medicalSupplies}M)`,
            explanation: 'Player-configured custom fiscal allocation preserved within statutory and credit limits.',
            executedActionTitles: [
              `Evacuation: LKR ${norm.allocations.evacuation}M`,
              `Drinking Water: LKR ${norm.allocations.drinkingWater}M`,
              `Medical Supplies: LKR ${norm.allocations.medicalSupplies}M`
            ],
            netBudgetImpact: -sum
          }
        };
      }
    }
    // If player had selected a valid affordable preset plan (3A - 3D), preserve it
    if (norm.rankings && norm.rankings.length > 0) {
      const firstPlan = norm.rankings[0];
      if (['3A', '3B', '3C', '3D'].includes(firstPlan)) {
        if (budget - 100 >= -EMERGENCY_CREDIT_FACILITY_CAP) {
          const act = findAction(firstPlan, 3);
          return {
            decision: { rankings: [firstPlan] },
            emergencyFallback: false,
            policyDetails: {
              roundName: AUTHORITATIVE_FALLBACK_POLICIES[3].roundName,
              planOrActions: `Preset Plan ${firstPlan}`,
              explanation: act?.rationale || 'Player-selected preset plan committed within credit facility.',
              executedActionTitles: [act?.title || `Preset Plan ${firstPlan}`],
              netBudgetImpact: -100
            }
          };
        }
      }
    }

    // Deterministic Poor-Response Contingency Policy:
    // Available credit capacity before reaching hard -200M limit:
    const availableCapacity = Math.max(0, Math.min(100, Math.floor(budget + EMERGENCY_CREDIT_FACILITY_CAP)));

    if (availableCapacity >= 100) {
      // Inadequate Plan 3B (100M: 60 Evac, 40 Water, 0 Medical)
      return {
        decision: { 
          rankings: ['3B'],
          allocations: { evacuation: 60, drinkingWater: 40, medicalSupplies: 0 }
        },
        emergencyFallback: true,
        policyDetails: {
          roundName: AUTHORITATIVE_FALLBACK_POLICIES[3].roundName,
          planOrActions: 'Plan 3B (Evacuation 60M / Water 40M / Medical 0M)',
          explanation: 'Contingency holding action: Inadequate Plan 3B (Evac 60M, Water 40M, Medical 0M) completely starves emergency medical supplies, causing acute clinic stockouts and public distress.',
          executedActionTitles: [
            'Evacuation 60 / Water 40 / Medical 0 (LKR 100M)'
          ],
          netBudgetImpact: -100
        }
      };
    } else {
      // Reduced inadequate allocation formula proportional to Plan 3B:
      // 60% Evacuation, 40% Drinking Water, 0% Medical Supplies (starving healthcare)
      const evac = Math.floor(availableCapacity * 0.60);
      const water = availableCapacity - evac;
      const med = 0;

      return {
        decision: {
          allocations: {
            evacuation: evac,
            drinkingWater: water,
            medicalSupplies: med
          }
        },
        emergencyFallback: true,
        policyDetails: {
          roundName: AUTHORITATIVE_FALLBACK_POLICIES[3].roundName,
          planOrActions: `Reduced Inadequate Allocation (Evac ${evac}M, Water ${water}M, Med 0M)`,
          explanation: `Credit capacity constrained to LKR ${availableCapacity}M. Applied inadequate 60/40/0 sector-allocation rule strictly respecting the -LKR 200M Emergency Credit Facility ceiling while completely neglecting medical needs.`,
          executedActionTitles: [
            `Emergency Evacuation: LKR ${evac}M`,
            `Drinking Water Distribution: LKR ${water}M`,
            `Medical Supplies & Triage: LKR 0M (Starved)`
          ],
          netBudgetImpact: availableCapacity === 0 ? 0 : -availableCapacity
        }
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Day 6 (Bucket 4): Fleet Distribution
  // ---------------------------------------------------------------------------
  if (bucket === 4) {
    // If player had valid custom fleet allocation within budget, preserve it
    if (norm.allocations && typeof norm.allocations === 'object') {
      const { trucksKelani = 0, vehiclesKelani = 0, boatsKelani = 0, trucksDryZone = 0, vehiclesDryZone = 0, boatsDryZone = 0 } = norm.allocations;
      const valid = trucksKelani >= 0 && vehiclesKelani >= 0 && boatsKelani >= 0 &&
                    trucksDryZone >= 0 && vehiclesDryZone >= 0 && boatsDryZone >= 0 &&
                    (trucksKelani + trucksDryZone <= 20) &&
                    (vehiclesKelani + vehiclesDryZone <= 30) &&
                    (boatsKelani + boatsDryZone <= 20);
      const totalUnits = trucksKelani + vehiclesKelani + boatsKelani + trucksDryZone + vehiclesDryZone + boatsDryZone;
      if (valid && totalUnits > 0) {
        if (budget - 60 >= -EMERGENCY_CREDIT_FACILITY_CAP) {
          return {
            decision: norm,
            emergencyFallback: false,
            policyDetails: {
              roundName: AUTHORITATIVE_FALLBACK_POLICIES[4].roundName,
              planOrActions: 'Custom Fleet Distribution',
              explanation: 'Player-configured fleet distribution committed with LKR 60M mobilization fee.',
              executedActionTitles: ['Custom Fleet Distribution (LKR 60M fee)'],
              netBudgetImpact: -60
            }
          };
        }
      }
    }
    // If player had selected a valid preset plan, preserve it
    if (norm.rankings && norm.rankings.length > 0) {
      const firstPlan = norm.rankings[0];
      if (['4A', '4B', '4C', '4D'].includes(firstPlan)) {
        if (budget - 60 >= -EMERGENCY_CREDIT_FACILITY_CAP) {
          const act = findAction(firstPlan, 4);
          return {
            decision: { rankings: [firstPlan] },
            emergencyFallback: false,
            policyDetails: {
              roundName: AUTHORITATIVE_FALLBACK_POLICIES[4].roundName,
              planOrActions: `Preset Fleet Plan ${firstPlan}`,
              explanation: act?.rationale || 'Player-selected fleet preset committed with LKR 60M mobilization fee.',
              executedActionTitles: [act?.title || `Fleet Plan ${firstPlan}`],
              netBudgetImpact: -60
            }
          };
        }
      } else if (firstPlan === '4E') {
        return {
          decision: { rankings: ['4E'] },
          emergencyFallback: false,
          policyDetails: {
            roundName: AUTHORITATIVE_FALLBACK_POLICIES[4].roundName,
            planOrActions: 'Plan 4E (Held in Reserve)',
            explanation: 'Fleet held in depot reserves awaiting external humanitarian support (LKR 0M fee).',
            executedActionTitles: ['Hold all resources in reserve (LKR 0M)'],
            netBudgetImpact: 0
          }
        };
      }
    }

    // Deterministic Poor-Response Contingency Policy:
    // Defaults to Plan 4E (Held in Reserve, 0M fee), leaving rescue operations unserved during the surge
    return {
      decision: { 
        rankings: ['4E'],
        allocations: {
          trucks_flood: 0, trucks_dryzone: 0,
          vehicles_flood: 0, vehicles_dryzone: 0,
          boats_flood: 0, boats_dryzone: 0
        }
      },
      emergencyFallback: true,
      policyDetails: {
        roundName: AUTHORITATIVE_FALLBACK_POLICIES[4].roundName,
        planOrActions: 'Plan 4E (Fleet Held in Reserve)',
        explanation: 'Contingency holding action: Entire 70-unit fleet held in depot reserves (Plan 4E) at LKR 0M cost. Left flood rescue and dry-zone water operations unserved during the critical surge window, severely eroding civic trust and survival margins.',
        executedActionTitles: [
          'Hold all resources in reserve and wait for external assistance (LKR 0M)'
        ],
        netBudgetImpact: 0
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Operational Rounds: Day 0 (B1), Day 2 (B2), Day 8 (B5), Day 10 (B6)
  // ---------------------------------------------------------------------------
  let fallbackRankings: string[];
  let rationale: string;
  let netDrain: number;

  if (bucket === 1) {
    fallbackRankings = [...AUTHORITATIVE_FALLBACK_POLICIES[1].rankings];
    rationale = AUTHORITATIVE_FALLBACK_POLICIES[1].rationale;
    netDrain = AUTHORITATIVE_FALLBACK_POLICIES[1].totalCost; // 15M (0 + 5 + 10)
  } else if (bucket === 2) {
    fallbackRankings = [...AUTHORITATIVE_FALLBACK_POLICIES[2].rankings];
    rationale = AUTHORITATIVE_FALLBACK_POLICIES[2].rationale;
    netDrain = AUTHORITATIVE_FALLBACK_POLICIES[2].totalCost; // 10M (0 + 2 + 8)
  } else if (bucket === 5) {
    fallbackRankings = [...AUTHORITATIVE_FALLBACK_POLICIES[5].solventRankings];
    rationale = AUTHORITATIVE_FALLBACK_POLICIES[5].rationale;
    netDrain = AUTHORITATIVE_FALLBACK_POLICIES[5].totalCost; // -30M net spend (+30M gain)
  } else {
    // Day 10 (Bucket 6)
    fallbackRankings = [...AUTHORITATIVE_FALLBACK_POLICIES[6].solventRankings];
    rationale = AUTHORITATIVE_FALLBACK_POLICIES[6].rationale;
    netDrain = AUTHORITATIVE_FALLBACK_POLICIES[6].totalCost; // -35M net spend (+35M gain)
  }

  // If user provided a complete 5-item permutation and it is solvent, evaluate it
  const canonicalIds: Record<number, string[]> = {
    1: ['1A', '1B', '1C', '1D', '1E'],
    2: ['2A', '2B', '2C', '2D', '2E'],
    5: ['5A', '5B', '5C', '5D', '5E'],
    6: ['6A', '6B', '6C', '6D', '6E']
  };
  const fullCanonical = canonicalIds[bucket] || fallbackRankings;
  const userRanks = (norm.rankings || []).filter(id => fullCanonical.includes(id));
  const uniqueUserRanks = Array.from(new Set(userRanks));

  const getTop3Drain = (ranks: string[]) => {
    let drain = 0;
    ranks.slice(0, 3).forEach(id => {
      const act = findAction(id, bucket);
      if (act) {
        drain -= (act.impacts?.emergencyBudget ?? 0);
      }
    });
    return drain;
  };

  if (uniqueUserRanks.length === 5) {
    const drain = getTop3Drain(uniqueUserRanks);
    if (budget - drain >= -EMERGENCY_CREDIT_FACILITY_CAP) {
      const executed = uniqueUserRanks.slice(0, 3);
      const actionTitles = executed.map(id => {
        const act = findAction(id, bucket);
        return act ? `${id}: ${act.title}` : id;
      });
      return {
        decision: { rankings: uniqueUserRanks },
        emergencyFallback: false,
        policyDetails: {
          roundName: AUTHORITATIVE_FALLBACK_POLICIES[bucket as keyof typeof AUTHORITATIVE_FALLBACK_POLICIES]?.roundName || `Day ${(bucket - 1) * 2}`,
          planOrActions: `Autonomous Directives: ${executed.join(', ')}`,
          explanation: 'Player-ranked directives authorized within provincial treasury limits.',
          executedActionTitles: actionTitles,
          netBudgetImpact: -drain
        }
      };
    }
  }

  let finalRankings = fallbackRankings;
  let finalDrain = netDrain;
  let finalExplanation = rationale;

  if (uniqueUserRanks.length > 0 && uniqueUserRanks.length < 5) {
    const merged = [
      ...uniqueUserRanks,
      ...fallbackRankings.filter(id => !uniqueUserRanks.includes(id))
    ];
    if (merged.length === 5) {
      const mergedDrain = getTop3Drain(merged);
      if (budget - mergedDrain >= -EMERGENCY_CREDIT_FACILITY_CAP) {
        finalRankings = merged;
        finalDrain = mergedDrain;
        finalExplanation = 'Deliberation deadline expired with partial selections. Contingency policy preserved player directives and completed safe ranking within credit limits.';
      }
    }
  }

  // Emergency Fallback: commit the deterministic fallback rankings
  const top3Executed = finalRankings.slice(0, 3);
  const top3Titles = top3Executed.map(id => {
    const act = findAction(id, bucket);
    return act ? `${id}: ${act.title}` : id;
  });

  return {
    decision: { rankings: finalRankings },
    emergencyFallback: true,
    policyDetails: {
      roundName: AUTHORITATIVE_FALLBACK_POLICIES[bucket as keyof typeof AUTHORITATIVE_FALLBACK_POLICIES]?.roundName || `Day ${(bucket - 1) * 2}`,
      planOrActions: top3Executed.join(', '),
      explanation: finalExplanation,
      executedActionTitles: top3Titles,
      netBudgetImpact: finalDrain === 0 ? 0 : -finalDrain
    }
  };
}

/**
 * Applies a player's decision to the current GameState, mutating scores, resources,
 * community, and telemetry synchronously and advancing the timeline.
 */
export function processDecision(
  state: GameState,
  userId: string,
  decision: { rankings?: ActionId[]; allocations?: Record<string, number> } | ActionId[],
  decisionMeta?: {
    timeSpentSeconds?: number;
    timeoutOccurred?: boolean;
    emergencyFallback?: boolean;
    roundStartedAt?: string;
    roundDeadlineAt?: string;
    decisionSubmittedAt?: string;
    responseTimeMs?: number;
    roundDurationSeconds?: number;
    timedOut?: boolean;
    fallbackApplied?: boolean;
    decisionMode?: SimulationMode;
    fallbackPolicyDetails?: FallbackPolicyDetails;
  }
): GameState {
  const normDecision = Array.isArray(decision) ? { rankings: decision } : decision;

  // Validate constraints for resource rounds and Emergency Credit Facility
  const constraintCheck = validateConstraints(state.bucket, normDecision, state.resources?.emergencyBudget);
  if (!constraintCheck.valid) {
    const isEmergency = Boolean(
      decisionMeta?.fallbackApplied || 
      decisionMeta?.emergencyFallback || 
      decisionMeta?.timedOut
    );
    if (!isEmergency) {
      throw new Error(constraintCheck.error || 'Decision violates operational constraints.');
    }
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

  // Escalating command friction consequences if emergency fallback was engaged due to timeout
  const isTimeout = decisionMeta?.timedOut ?? decisionMeta?.timeoutOccurred ?? false;
  const isFallback = decisionMeta?.fallbackApplied ?? decisionMeta?.emergencyFallback ?? false;

  // 5. Update Decision Quality: System interventions must not count as human decision achievements
  if (isFallback) {
    // Dock decision quality by 10 points for automated contingency intervention (floor 0)
    newState.scores.decisionQuality = Math.max(
      0,
      Math.min(100, Math.round(newState.scores.decisionQuality - 10))
    );
  } else {
    newState.scores.decisionQuality = Math.max(
      0,
      Math.min(100, Math.round(newState.scores.decisionQuality + delta.decisionQuality))
    );
  }

  // 6. Lifeline Operations Synchronization
  newState.operations.communication = newState.information.informationQuality;
  newState.resources.drinkingWater = Math.max(5, Math.min(100, Math.round(newState.scores.droughtPreparedness)));
  newState.resources.agriculturalWater = Math.max(5, Math.min(100, Math.round(newState.scores.droughtPreparedness * 0.9)));
  newState.risks.floodRisk = Math.max(5, Math.min(95, 100 - newState.scores.floodPreparedness));
  newState.risks.droughtRisk = Math.max(5, Math.min(95, 100 - newState.scores.droughtPreparedness));

  // 7. Dynamic Events Tracking
  newState.activeDynamicEvents = delta.triggeredEvents || [];

  if (isTimeout && isFallback) {
    if (state.bucket === 1) {
      newState.community.communityTrust = Math.max(0, newState.community.communityTrust - 4);
      newState.scores.communityTrust = newState.community.communityTrust;
      newState.information.informationQuality = Math.max(0, newState.information.informationQuality - 3);
      newState.scores.informationQuality = newState.information.informationQuality;
    } else if (state.bucket === 2) {
      newState.scores.floodPreparedness = Math.max(0, newState.scores.floodPreparedness - 4);
      newState.risks.floodRisk = Math.min(95, newState.risks.floodRisk + 5);
    } else if (state.bucket === 3) {
      newState.resources.emergencySupplies = Math.max(0, newState.resources.emergencySupplies - 5);
      newState.community.communityTrust = Math.max(0, newState.community.communityTrust - 3);
      newState.scores.communityTrust = newState.community.communityTrust;
    } else if (state.bucket === 4) {
      newState.community.communityTrust = Math.max(0, newState.community.communityTrust - 4);
      newState.scores.communityTrust = newState.community.communityTrust;
      newState.community.panicLevel = Math.min(100, newState.community.panicLevel + 5);
    } else if (state.bucket === 5) {
      newState.operations.sanitation = Math.max(0, newState.operations.sanitation - 5);
      newState.risks.healthRisk = Math.min(95, newState.risks.healthRisk + 5);
    } else if (state.bucket === 6) {
      newState.community.householdsSupported = Math.max(0, newState.community.householdsSupported - 100);
    }
  }

  // 8. Record in Official Decision History
  const roundStartedAt = decisionMeta?.roundStartedAt || state.roundStartTime || new Date().toISOString();
  const roundDurationSeconds = decisionMeta?.roundDurationSeconds || state.roundDurationSeconds || getRoundDuration(state.bucket);
  const roundDeadlineAt = decisionMeta?.roundDeadlineAt || state.roundDeadline || new Date(new Date(roundStartedAt).getTime() + roundDurationSeconds * 1000).toISOString();
  const decisionSubmittedAt = decisionMeta?.decisionSubmittedAt || new Date().toISOString();
  const responseTimeMs = decisionMeta?.responseTimeMs !== undefined
    ? decisionMeta.responseTimeMs
    : (decisionMeta?.timeSpentSeconds !== undefined ? decisionMeta.timeSpentSeconds * 1000 : Math.max(0, new Date(decisionSubmittedAt).getTime() - new Date(roundStartedAt).getTime()));
  const timeSpentSeconds = Math.round(responseTimeMs / 1000);
  const decisionMode: SimulationMode = decisionMeta?.decisionMode || state.simulationMode || 'tournament';

  // Compute action titles for executed directives
  let actionTitles: string[] = [];
  if (state.bucket === 3) {
    if (normDecision.rankings?.[0]) {
      const plan = normDecision.rankings[0];
      const act = findAction(plan, 3);
      actionTitles = [act ? `${plan}: ${act.title}` : `Preset Plan ${plan}`];
    } else if (normDecision.allocations) {
      actionTitles = [
        `Emergency Evacuation: LKR ${normDecision.allocations.evacuation ?? 0}M`,
        `Drinking Water Distribution: LKR ${normDecision.allocations.drinkingWater ?? 0}M`,
        `Medical Supplies & Triage: LKR ${normDecision.allocations.medicalSupplies ?? 0}M`
      ];
    }
  } else if (state.bucket === 4) {
    if (normDecision.rankings?.[0]) {
      const plan = normDecision.rankings[0];
      const act = findAction(plan, 4);
      actionTitles = [act ? `${plan}: ${act.title}` : `Preset Fleet Plan ${plan}`];
    } else if (normDecision.allocations) {
      actionTitles = [
        'Custom Fleet Distribution (Flood / Dry Zone Deployment)'
      ];
    }
  } else {
    actionTitles = (delta.executedActionIds || []).map(id => {
      const act = findAction(id, state.bucket);
      return act ? `${id}: ${act.title}` : id;
    });
  }

  newState.decisionHistory.push({
    bucket: state.bucket,
    day: state.day,
    userId,
    scenarioTitle: SCENARIOS[state.bucket]?.title,
    actionTitles,
    rankings: normDecision.rankings,
    allocations: normDecision.allocations,
    executedActionIds: delta.executedActionIds,
    triggeredEvents: delta.triggeredEvents?.map(e => e.id),
    timestamp: new Date(decisionSubmittedAt),
    timeSpentSeconds,
    timeoutOccurred: isTimeout,
    emergencyFallback: isFallback,
    isSystemContingency: isFallback,
    isHumanDecision: !isFallback,
    roundStartedAt,
    roundDeadlineAt,
    decisionSubmittedAt,
    responseTimeMs,
    roundDurationSeconds,
    timedOut: isTimeout,
    fallbackApplied: isFallback,
    decisionMode,
    financialEffects: {
      budgetDelta: delta.emergencyBudget,
      treasuryRemaining: newState.resources.emergencyBudget
    }
  });

  // 9. Advance Bucket & Day
  newState.bucket += 1;
  newState.day = (newState.bucket - 1) * 2;

  // Setup round deadline and shuffled card orders for next bucket if active
  if (isFallback) {
    // FIX A: A timeout contingency fallback was committed.
    // Persist a pendingFallbackAcknowledgement record associated with completed round and fallback details.
    const completedBucket = state.bucket;
    const completedDay = state.day;
    const policy = AUTHORITATIVE_FALLBACK_POLICIES[completedBucket as keyof typeof AUTHORITATIVE_FALLBACK_POLICIES];
    const roundName = decisionMeta?.fallbackPolicyDetails?.roundName || (policy ? policy.roundName : `Round ${completedBucket}`);
    const executedTitles = actionTitles.length > 0
      ? actionTitles
      : (decisionMeta?.fallbackPolicyDetails?.executedActionTitles || []);

    newState.pendingFallbackAcknowledgement = {
      completedBucket,
      completedDay,
      roundName,
      reason: decisionMeta?.fallbackPolicyDetails?.explanation || `Authoritative round deadline elapsed (${roundDurationSeconds}s). Emergency contingency protocol authorized.`,
      planOrActions: decisionMeta?.fallbackPolicyDetails?.planOrActions,
      executedActionTitles: executedTitles,
      netBudgetImpact: delta.emergencyBudget,
      treasuryRemaining: newState.resources.emergencyBudget,
      timestamp: decisionSubmittedAt
    };

    // Official decision timer for the next round remains PAUSED until player explicitly acknowledges the report!
    newState.roundStartTime = undefined;
    newState.roundDeadline = undefined;

    if (newState.bucket <= 6) {
      newState.roundDurationSeconds = getRoundDuration(newState.bucket);
      if (!newState.shuffledCardOrders) {
        newState.shuffledCardOrders = {};
      }
      if (!newState.shuffledCardOrders[newState.bucket]) {
        newState.shuffledCardOrders[newState.bucket] = getDefaultBucketShuffledOrder(newState.seed || 'seed', newState.bucket);
      }
    }
  } else {
    newState.pendingFallbackAcknowledgement = null;
    // Normal human-submitted decision: start next round's official decision timer immediately
    if (newState.bucket <= 6) {
      const nextDuration = getRoundDuration(newState.bucket);
      const now = new Date();
      newState.roundStartTime = now.toISOString();
      newState.roundDeadline = new Date(now.getTime() + nextDuration * 1000).toISOString();
      newState.roundDurationSeconds = nextDuration;

      if (!newState.shuffledCardOrders) {
        newState.shuffledCardOrders = {};
      }
      if (!newState.shuffledCardOrders[newState.bucket]) {
        newState.shuffledCardOrders[newState.bucket] = getDefaultBucketShuffledOrder(newState.seed || 'seed', newState.bucket);
      }
    }
  }

  return newState;
}

/**
 * Returns the scenario data for a given bucket index (1 to 6).
 */
export function determineScenarioForBucket(bucket: number): BucketScenario | null {
  return SCENARIOS[bucket] || null;
}

/**
 * Calculates Team Performance Index (TPI) for competitive assessment.
 * Evaluates execution quality across six rigorous disaster management pillars:
 * 1. Disaster Outcomes and Preparedness (35%): Driven by Composite Preparedness Score (CPS)
 * 2. Decision Quality (20%): Strategic appropriateness of chosen operational directives
 * 3. Resource and Financial Management (15%): Macro treasury stewardship, credit facility discipline, and allocation efficiency
 * 4. Response Speed & Command Agility (10%): Velocity and composure under countdown pressure without timeouts
 * 5. Community Protection and Equity (10%): Civic trust, public compliance, and public health preservation
 * 6. Recovery Readiness (10%): Operational capacity, logistical resilience, and reconstruction reserves on Day 10
 */
export function calculateTpi(
  state: GameState,
  cps: number
): { tpi: number; tpiDetails: TpiCalculationDetails } {
  const { scores, resources, community, operations, decisionHistory = [] } = state;

  const totalRounds = decisionHistory.length;
  let timeoutsCount = 0;
  let fallbacksCount = 0;
  let humanDecisionsCount = decisionHistory.length === 0 ? 6 : 0;
  let totalTimeSpent = 0;
  const speedScores: number[] = [];

  if (decisionHistory.length > 0) {
    for (const h of decisionHistory) {
      const isTimeout = h.timedOut ?? h.timeoutOccurred ?? false;
      const isFallback = h.fallbackApplied ?? h.emergencyFallback ?? h.isSystemContingency ?? false;
      if (isTimeout) timeoutsCount++;
      if (isFallback) fallbacksCount++;
      if (!isFallback) humanDecisionsCount++;
      const timeSpent = typeof h.responseTimeMs === 'number'
        ? Math.round(h.responseTimeMs / 1000)
        : (typeof h.timeSpentSeconds === 'number' ? h.timeSpentSeconds : 45);
      totalTimeSpent += timeSpent;

      const maxDuration = h.roundDurationSeconds || getRoundDuration(h.bucket);
      const ratio = timeSpent / maxDuration;

      let roundSpeedScore = 75;
      if (isTimeout && isFallback) {
        roundSpeedScore = 40; // Severe timeout intervention penalty
      } else if (isTimeout && !isFallback) {
        roundSpeedScore = 65; // Buzzer-beater / deliberate overtime submission
      } else if (ratio <= 0.15) {
        roundSpeedScore = 80; // Hasty decision
      } else if (ratio <= 0.70) {
        roundSpeedScore = 100; // Optimal deliberation speed
      } else if (ratio <= 0.90) {
        roundSpeedScore = 85; // Good command pacing
      } else {
        roundSpeedScore = 70; // Delayed submission under warning
      }
      speedScores.push(roundSpeedScore);
    }
  }

  const avgSpeed = speedScores.length > 0
    ? speedScores.reduce((a, b) => a + b, 0) / speedScores.length
    : 75;
  const speedRaw = Math.max(0, Math.min(100, Math.round(avgSpeed)));
  const speedContrib = Math.round(speedRaw * 0.10 * 10) / 10;
  const avgDecisionTimeSeconds = decisionHistory.length > 0
    ? Math.round(totalTimeSpent / decisionHistory.length)
    : 45;

  // Zero human-authorized rounds: CPS 0, TPI 0, Tier 4
  const isZeroHuman = totalRounds > 0 && humanDecisionsCount === 0;

  if (isZeroHuman) {
    const zeroComponents: TpiComponent[] = [
      {
        pillar: 'Disaster Outcomes & Preparedness',
        weightPercent: 35,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      },
      {
        pillar: 'Decision Quality',
        weightPercent: 20,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      },
      {
        pillar: 'Resource & Financial Management',
        weightPercent: 15,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      },
      {
        pillar: 'Response Speed & Command Agility',
        weightPercent: 10,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      },
      {
        pillar: 'Community Protection & Equity',
        weightPercent: 10,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      },
      {
        pillar: 'Recovery Readiness',
        weightPercent: 10,
        rawScore: 0,
        weightedContribution: 0,
        description: 'Command autopilot override: Zero human decisions submitted across 6 rounds'
      }
    ];

    return {
      tpi: 0.0,
      tpiDetails: {
        components: zeroComponents,
        totalTpi: 0.0,
        averageDecisionTimeSeconds: avgDecisionTimeSeconds,
        totalDecisionTimeSeconds: Math.round(totalTimeSpent),
        timeoutsCount,
        fallbacksCount,
        humanDecisionsCount: 0,
        participationMultiplier: 0,
        unadjustedTpi: 0,
        timeoutPenaltyPoints: fallbacksCount * 10
      }
    };
  }

  // Pillar 1: Disaster Outcomes and Preparedness (35%)
  const outcomeRaw = Math.max(0, Math.min(100, cps));
  const outcomeContrib = Math.round(outcomeRaw * 0.35 * 10) / 10;

  // Pillar 2: Decision Quality (20%)
  const dqRaw = Math.max(0, Math.min(100, scores.decisionQuality));
  const dqContrib = Math.round(dqRaw * 0.20 * 10) / 10;

  // Pillar 3: Resource & Financial Management (15%)
  let finRaw = scores.resourceScore;
  if (resources.emergencyBudget < 0) {
    const debt = Math.abs(resources.emergencyBudget);
    finRaw = Math.max(0, finRaw - Math.min(40, (debt / 200) * 40));
  } else if (resources.emergencyBudget >= 50 && resources.emergencyBudget <= 250) {
    finRaw = Math.min(100, finRaw + 5); // Fiscal buffer bonus
  }
  finRaw = Math.max(0, Math.min(100, Math.round(finRaw)));
  const finContrib = Math.round(finRaw * 0.15 * 10) / 10;

  // Pillar 5: Community Protection & Equity (10%)
  const healthVal = operations?.health ?? 60;
  const commRaw = Math.max(0, Math.min(100, Math.round(
    0.40 * community.communityTrust +
    0.30 * community.publicCompliance +
    0.30 * healthVal
  )));
  const commContrib = Math.round(commRaw * 0.10 * 10) / 10;

  // Pillar 6: Recovery Readiness (10%)
  const transVal = operations?.transportation ?? 70;
  const sanitVal = operations?.sanitation ?? 50;
  const suppliesVal = resources?.emergencySupplies ?? 50;
  const medVal = resources?.medicalSupplies ?? 50;
  const recRaw = Math.max(0, Math.min(100, Math.round(
    0.30 * transVal +
    0.25 * suppliesVal +
    0.25 * medVal +
    0.20 * sanitVal
  )));
  const recContrib = Math.round(recRaw * 0.10 * 10) / 10;

  const unadjustedTpi = Math.max(0, Math.min(100, Math.round(
    (outcomeContrib + dqContrib + finContrib + speedContrib + commContrib + recContrib) * 10
  ) / 10));

  // Transparent tournament participation & timeout adjustment:
  // TPI = clamp(unadjustedTpi - 10 * F, 0, 100) * (H / 6)
  const timeoutPenaltyPoints = fallbacksCount * 10;
  const participationMultiplier = humanDecisionsCount / 6;
  const clampedTpiSubtotal = Math.max(0, Math.min(100, unadjustedTpi - timeoutPenaltyPoints));
  const finalTpi = Math.max(0, Math.min(100, Math.round(clampedTpiSubtotal * participationMultiplier * 10) / 10));

  // Scale components so their sum equals finalTpi
  const scaleRatio = unadjustedTpi > 0 ? (finalTpi / unadjustedTpi) : 0;
  const components: TpiComponent[] = [
    {
      pillar: 'Disaster Outcomes & Preparedness',
      weightPercent: 35,
      rawScore: outcomeRaw,
      weightedContribution: Math.round(outcomeContrib * scaleRatio * 10) / 10,
      description: 'Flood & drought resilience and survival stability under compound hazard pressure'
    },
    {
      pillar: 'Decision Quality',
      weightPercent: 20,
      rawScore: dqRaw,
      weightedContribution: Math.round(dqContrib * scaleRatio * 10) / 10,
      description: 'Appropriateness, coherence, and efficacy of prioritized command actions'
    },
    {
      pillar: 'Resource & Financial Management',
      weightPercent: 15,
      rawScore: finRaw,
      weightedContribution: Math.round(finContrib * scaleRatio * 10) / 10,
      description: 'Macro treasury stewardship, credit facility discipline, and allocation efficiency'
    },
    {
      pillar: 'Response Speed & Command Agility',
      weightPercent: 10,
      rawScore: speedRaw,
      weightedContribution: Math.round(speedContrib * scaleRatio * 10) / 10,
      description: 'Composure and prompt decision delivery without incurring emergency timeouts'
    },
    {
      pillar: 'Community Protection & Equity',
      weightPercent: 10,
      rawScore: commRaw,
      weightedContribution: Math.round(commContrib * scaleRatio * 10) / 10,
      description: 'Civic trust, public order compliance, and lifeline healthcare protection'
    },
    {
      pillar: 'Recovery Readiness',
      weightPercent: 10,
      rawScore: recRaw,
      weightedContribution: Math.round(recContrib * scaleRatio * 10) / 10,
      description: 'Residual transport capacity, supply buffers, and reconstruction foundation'
    }
  ];

  // Balance rounding residual so sum of components equals finalTpi exactly
  const tpiCompSum = Math.round(components.reduce((sum, c) => sum + c.weightedContribution, 0) * 10) / 10;
  const tpiResidual = Math.round((finalTpi - tpiCompSum) * 10) / 10;
  if (tpiResidual !== 0 && components.length > 0) {
    components[0].weightedContribution = Math.round((components[0].weightedContribution + tpiResidual) * 10) / 10;
  }

  return {
    tpi: finalTpi,
    tpiDetails: {
      components,
      totalTpi: finalTpi,
      averageDecisionTimeSeconds: avgDecisionTimeSeconds,
      totalDecisionTimeSeconds: Math.round(totalTimeSpent),
      timeoutsCount,
      fallbacksCount,
      humanDecisionsCount,
      participationMultiplier: Math.round(participationMultiplier * 1000) / 1000,
      unadjustedTpi,
      timeoutPenaltyPoints
    }
  };
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
  const decisionHistory = state.decisionHistory || [];
  const totalRounds = decisionHistory.length;
  const timeoutsCount = decisionHistory.filter(h => h.timedOut ?? h.timeoutOccurred ?? false).length;
  const fallbacksCount = decisionHistory.filter(h => h.fallbackApplied ?? h.emergencyFallback ?? h.isSystemContingency ?? false).length;
  const humanDecisionsCount = decisionHistory.length === 0
    ? 6 // Standalone mock state for unit testing without history: standard 6-round human baseline
    : decisionHistory.filter(h => !(h.fallbackApplied ?? h.emergencyFallback ?? h.isSystemContingency ?? false)).length;

  // FIX B: All-timeout failure rule (all rounds resolved through fallback intervention and zero human decisions accepted)
  const isAllTimeoutFailure = totalRounds > 0 && humanDecisionsCount === 0;

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

  // ---------------------------------------------------------------------------
  // TOURNAMENT SCORING FORMULA:
  // CPS = clamp(B - P - 10 * F, 0, 100) * (H / 6)
  // B: Weighted baseline sum (5 pillars)
  // P: Crisis failure deductions (breachedFailuresCount * 12)
  // F: Fallback interventions count (10 pts per fallback)
  // H: Human-authorized decisions count (between 0 and 6)
  // ---------------------------------------------------------------------------
  const timeoutDeduction = fallbacksCount * FALLBACK_INTERVENTION_PENALTY_PER_ROUND;
  const participationMultiplier = humanDecisionsCount / 6;
  const clampedSubtotal = Math.max(0, Math.min(100, baselineWeightedSum - failurePenaltyPoints - timeoutDeduction));
  const unroundedCps = clampedSubtotal * participationMultiplier;
  const cps = Math.round(unroundedCps * 10) / 10;

  let endingTier: EndingTier;
  let rating: PreparednessRating;

  if (humanDecisionsCount === 0) {
    endingTier = 'Tier 4: Systemic Crisis';
    rating = 'Critical';
  } else if (breachedFailuresCount >= 2 || cps < 40) {
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

  const pathway: ScenarioOutcome = droughtPreparedness < floodPreparedness ? 'Flood' : 'Drought';

  // ---------------------------------------------------------------------------
  // TRADE-OFFS & DEBRIEF NARRATIVE
  // ---------------------------------------------------------------------------
  const tradeoffs: string[] = [];

  if (isAllTimeoutFailure) {
    tradeoffs.push('Total Command Default: Zero operational decisions were authorized by the command team across all six decision cycles. Automated contingencies executed autopilot holding actions.');
  }

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

  // Balance rounding residual so sum of pillar contributions equals baselineWeightedSum exactly
  const compSum = Math.round(weightedComponents.reduce((sum, c) => sum + c.contribution, 0) * 10) / 10;
  const residual = Math.round((baselineWeightedSum - compSum) * 10) / 10;
  if (residual !== 0 && weightedComponents.length > 0) {
    weightedComponents[0].contribution = Math.round((weightedComponents[0].contribution + residual) * 10) / 10;
  }

  const arithmeticMean = Math.round(
    ((floodPreparedness + droughtPreparedness + resourceScore + informationQuality + communityTrust + decisionQuality) / 6) * 10
  ) / 10;

  let explanation = '';
  if (humanDecisionsCount === 0) {
    explanation = 'Command failure: Zero human decisions were authorized across the six decision windows (6 fallback interventions). The automated contingency system executed holding actions, resulting in a command score of 0.0 / 100 (Tier 4).';
  } else if (fallbacksCount > 0) {
    explanation = `Baseline (${baselineWeightedSum.toFixed(1)}) minus ${failurePenaltyPoints.toFixed(1)} pts crisis deductions and minus ${timeoutDeduction.toFixed(1)} pts timeout deductions (${fallbacksCount} @ 10 pts) = ${clampedSubtotal.toFixed(1)} pts subtotal, multiplied by human participation ratio ${humanDecisionsCount}/6 (${(participationMultiplier * 100).toFixed(1)}%) yields ${cps.toFixed(1)} pts.`;
  } else if (failurePenaltyPoints > 0) {
    explanation = `Baseline (${baselineWeightedSum.toFixed(1)}) minus ${failurePenaltyPoints.toFixed(1)} pts crisis deductions across 6 human-authorized rounds yields ${cps.toFixed(1)} pts.`;
  } else {
    explanation = `Baseline is ${baselineWeightedSum.toFixed(1)} pts across 6 human-authorized rounds with zero crisis or timeout deductions.`;
  }

  const calculationDetails: ScoreCalculationDetails = {
    weightedComponents,
    baselineWeightedSum,
    breachedFailuresCount,
    failurePenaltyPoints,
    humanDecisionsCount,
    fallbackCount: fallbacksCount,
    fallbackInterventionPenalty: timeoutDeduction,
    timeoutDeduction,
    participationMultiplier: Math.round(participationMultiplier * 1000) / 1000,
    clampedSubtotal,
    allTimeoutZeroOverride: humanDecisionsCount === 0,
    scoreAfterPenalties: clampedSubtotal,
    curveAdjustment: 0,
    finalCps: cps,
    arithmeticMean,
    explanation
  };

  // ---------------------------------------------------------------------------
  // EXECUTIVE MISSION ANALYSIS NARRATIVE
  // ---------------------------------------------------------------------------
  let summary = '';
  if (isAllTimeoutFailure) {
    summary = 'Systemic disaster crisis. The command team did not submit decisions within any of the six decision windows, so the contingency system completed the campaign and the team\'s command-performance score is zero.';
  } else if (endingTier === 'Tier 1: Exemplary Climate Resilience') {
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

  // Calculate Team Performance Index (TPI)
  const { tpi, tpiDetails } = calculateTpi(state, cps);

  return {
    cps,
    tpi,
    tpiDetails,
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
    explanation,
    calculationDetails,
    humanDecisionsCount,
    fallbackInterventionsCount: fallbacksCount,
    timeoutsCount,
    isAllTimeoutFailure
  };
}

// Backwards-compatible initial state getter
export const getInitialState = getInitialGameState;

