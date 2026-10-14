import { DynamicEventTrigger } from './types';
import { ROUND_DEADLINE_SECONDS, getDefaultBucketShuffledOrder } from './timer';

export interface EnvironmentState {
  rainfall: number;
  riverLevel: number;
  groundwaterLevel: number;
  reservoirLevel: number;
  rainfallProbability: number;
  floodProbability: number;
  droughtProbability: number;
  forecastConfidence: number;
  temperature: number;
}

export interface ResourceState {
  emergencyBudget: number; // in LKR Millions
  drinkingWater: number;   // 0 - 100%
  agriculturalWater: number;
  emergencySupplies: number;
  transportCapacity: number;
  storageCapacity: number;
  fuel: number;
  medicalSupplies: number;
}

export interface OperationalState {
  transportation: number;
  sanitation: number;
  health: number;
  communication: number;
  foodSecurity: number;
  publicSecurity: number;
  rescueCapacity: number;
}

export interface CommunityState {
  population: number;
  vulnerablePopulation: number;
  householdsSupported: number;
  communityTrust: number;
  publicCompliance: number;
  panicLevel: number;
  waterDemand: number;
}

export interface RiskState {
  floodRisk: number;
  droughtRisk: number;
  waterContaminationRisk: number;
  landslideRisk: number;
  foodSecurityRisk: number;
  healthRisk: number;
  infrastructureRisk: number;
  accessRisk: number;
}

export interface InformationState {
  informationQuality: number;
  forecastConfidence: number;
  officialInformationAvailable: number;
  localObservationQuality: number;
  conflictingReports: number;
  monitoringCoverage: number;
}

export interface ScoreState {
  floodPreparedness: number;
  droughtPreparedness: number;
  resourceScore: number;
  informationQuality: number;
  communityTrust: number;
  decisionQuality: number;
}

export interface GameState {
  sessionId: string;
  seed: string;
  bucket: number;
  day: number;
  
  // Real-time Emergency Timer and Server-Enforced Deadlines
  roundStartTime?: string;      // ISO string of round commencement
  roundDeadline?: string;       // ISO string of authoritative server deadline
  roundDurationSeconds?: number;// Duration allocated for this round in seconds
  
  // Randomized Action Cards (persisted display order per bucket)
  shuffledCardOrders?: Record<number, string[]>;

  environment: EnvironmentState;
  resources: ResourceState;
  community: CommunityState;
  operations: OperationalState;
  risks: RiskState;
  information: InformationState;
  scores: ScoreState;
  activeDynamicEvents?: DynamicEventTrigger[];
  
  decisionHistory: Array<{
    bucket: number;
    day: number;
    userId: string;
    rankings?: string[];
    allocations?: Record<string, number>;
    executedActionIds?: string[];
    triggeredEvents?: string[];
    timestamp: Date;
    timeSpentSeconds?: number;
    timeoutOccurred?: boolean;
    emergencyFallback?: boolean;
  }>;
}

// Initial default state factory matching 10 Days to Decide parameters
export function getInitialGameState(sessionId: string = 'default', seed: string = 'seed'): GameState {
  const initDuration = ROUND_DEADLINE_SECONDS[1] || 120;
  const now = new Date();
  const initDeadline = new Date(now.getTime() + initDuration * 1000);

  return {
    sessionId,
    seed,
    bucket: 1,
    day: 0,
    roundStartTime: now.toISOString(),
    roundDeadline: initDeadline.toISOString(),
    roundDurationSeconds: initDuration,
    shuffledCardOrders: {
      1: getDefaultBucketShuffledOrder(seed, 1)
    },
    environment: {
      rainfall: 50,
      riverLevel: 50,
      groundwaterLevel: 50,
      reservoirLevel: 50,
      rainfallProbability: 30,
      floodProbability: 20,
      droughtProbability: 40,
      forecastConfidence: 50,
      temperature: 30,
    },
    resources: {
      emergencyBudget: 500, // LKR 500 Million starting emergency allocation
      drinkingWater: 50,
      agriculturalWater: 50,
      emergencySupplies: 50,
      transportCapacity: 100,
      storageCapacity: 100,
      fuel: 100,
      medicalSupplies: 50,
    },
    community: {
      population: 10000,
      vulnerablePopulation: 1500,
      householdsSupported: 0,
      communityTrust: 50,
      publicCompliance: 50,
      panicLevel: 20,
      waterDemand: 50,
    },
    operations: {
      transportation: 80,
      sanitation: 50,
      health: 60,
      communication: 50,
      foodSecurity: 60,
      publicSecurity: 70,
      rescueCapacity: 70,
    },
    risks: {
      floodRisk: 30,
      droughtRisk: 40,
      waterContaminationRisk: 20,
      landslideRisk: 20,
      foodSecurityRisk: 30,
      healthRisk: 25,
      infrastructureRisk: 25,
      accessRisk: 20,
    },
    information: {
      informationQuality: 50,
      forecastConfidence: 50,
      officialInformationAvailable: 50,
      localObservationQuality: 50,
      conflictingReports: 20,
      monitoringCoverage: 50,
    },
    scores: {
      floodPreparedness: 50,
      droughtPreparedness: 50,
      resourceScore: 50,
      informationQuality: 50,
      communityTrust: 50,
      decisionQuality: 50,
    },
    decisionHistory: []
  };
}
