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
  emergencyBudget: number;
  drinkingWater: number;
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
  environment: EnvironmentState;
  resources: ResourceState;
  community: CommunityState;
  operations: OperationalState;
  risks: RiskState;
  information: InformationState;
  scores: ScoreState;
  
  // Historical decisions to allow replay/audit
  decisionHistory: Array<{
    bucket: number;
    day: number;
    userId: string;
    rankings: string[];
    timestamp: Date;
  }>;
}

// Initial default state factory
export function getInitialGameState(sessionId: string, seed: string): GameState {
  return {
    sessionId,
    seed,
    bucket: 1,
    day: 0,
    environment: {
      rainfall: 50,
      riverLevel: 50,
      groundwaterLevel: 60,
      reservoirLevel: 70,
      rainfallProbability: 30,
      floodProbability: 10,
      droughtProbability: 10,
      forecastConfidence: 50,
      temperature: 30,
    },
    resources: {
      emergencyBudget: 500000,
      drinkingWater: 100,
      agriculturalWater: 100,
      emergencySupplies: 100,
      transportCapacity: 100,
      storageCapacity: 5000,
      fuel: 100,
      medicalSupplies: 100,
    },
    community: {
      population: 10000,
      vulnerablePopulation: 1500,
      householdsSupported: 0,
      communityTrust: 50,
      publicCompliance: 50,
      panicLevel: 10,
      waterDemand: 50,
    },
    operations: {
      transportation: 100,
      sanitation: 100,
      health: 100,
      communication: 100,
      foodSecurity: 100,
      publicSecurity: 100,
      rescueCapacity: 100,
    },
    risks: {
      floodRisk: 10,
      droughtRisk: 10,
      waterContaminationRisk: 10,
      landslideRisk: 10,
      foodSecurityRisk: 10,
      healthRisk: 10,
      infrastructureRisk: 10,
      accessRisk: 10,
    },
    information: {
      informationQuality: 50,
      forecastConfidence: 50,
      officialInformationAvailable: 50,
      localObservationQuality: 50,
      conflictingReports: 10,
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
