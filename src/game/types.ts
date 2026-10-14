export type ActionId = string;

export interface ActionImpacts {
  floodPreparedness: number;  // Flood impact (+/-)
  droughtPreparedness: number; // Drought impact (+/-)
  emergencyBudget: number;     // Budget change in LKR Millions (- spend, + receive)
  communityTrust: number;      // Trust impact (+/-)
  informationQuality: number;  // Info impact (+/-)
}

export interface Action {
  id: ActionId;
  bucket: number;
  recommendedRank: number; // 1 to 5 (from 10 Days to Decide docx)
  title: string;
  description: string;
  impacts: ActionImpacts;
  rationale?: string;
}

export interface BucketDecision {
  bucket: number;
  day: number;
  rankings?: ActionId[]; // For operational priority rounds (Buckets 1, 2, 5, 6)
  allocations?: Record<string, number>; // For resource allocation rounds (Buckets 3 & 4)
}

export type PreparednessRating = 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
export type ScenarioOutcome = 'Flood' | 'Drought';
export type EndingTier = 
  | 'Tier 1: Exemplary Climate Resilience'
  | 'Tier 2: Competent Emergency Response'
  | 'Tier 3: Pyrrhic Survival'
  | 'Tier 4: Systemic Crisis';

export interface FailureStates {
  fiscalInsolvency: boolean;       // Budget <= 0
  catastrophicInundation: boolean; // Flood Prep < 35%
  droughtShock: boolean;           // Drought Prep < 30%
  civilBreakdown: boolean;         // Trust < 25%
}

export interface DynamicEventTrigger {
  id: string;
  title: string;
  description: string;
  impactType: 'positive' | 'warning' | 'negative';
  effects: Partial<ActionImpacts>;
}

export interface ScoreCalculationDetails {
  weightedComponents: {
    label: string;
    rawScore: number;
    weightPercent: number;
    contribution: number;
  }[];
  baselineWeightedSum: number;
  breachedFailuresCount: number;
  failurePenaltyPoints: number;
  humanDecisionsCount?: number;
  fallbackCount?: number;
  fallbackInterventionPenalty?: number;
  timeoutDeduction?: number;
  participationMultiplier?: number;
  clampedSubtotal?: number;
  allTimeoutZeroOverride?: boolean;
  scoreAfterPenalties: number;
  curveAdjustment: number;
  finalCps: number;
  arithmeticMean: number;
  explanation: string;
}

export interface PendingFallbackReport {
  completedBucket: number;
  completedDay: number;
  roundName: string;
  reason: string;
  planOrActions?: string;
  executedActionTitles: string[];
  netBudgetImpact: number;
  treasuryRemaining: number;
  timestamp: string;
}

export type SimulationMode = 'tournament' | 'practice';

export interface DecisionRecord {
  bucket: number;
  day: number;
  userId: string;
  scenarioTitle?: string;
  actionTitles?: string[];
  rankings?: string[];
  allocations?: Record<string, number>;
  executedActionIds?: string[];
  triggeredEvents?: string[];
  timestamp: Date;
  timeSpentSeconds?: number;
  timeoutOccurred?: boolean;
  emergencyFallback?: boolean;
  isSystemContingency?: boolean;
  isHumanDecision?: boolean;
  roundStartedAt?: string;
  roundDeadlineAt?: string;
  decisionSubmittedAt?: string;
  responseTimeMs?: number;
  roundDurationSeconds?: number;
  timedOut?: boolean;
  fallbackApplied?: boolean;
  decisionMode?: SimulationMode;
  financialEffects?: {
    budgetDelta: number;
    treasuryRemaining: number;
  };
}

export interface TpiComponent {
  pillar: string;
  weightPercent: number; // 35, 20, 15, 10, 10, 10
  rawScore: number;      // 0 - 100
  weightedContribution: number;
  description: string;
}

export interface TpiCalculationDetails {
  components: TpiComponent[];
  totalTpi: number; // 0 - 100
  averageDecisionTimeSeconds: number;
  totalDecisionTimeSeconds?: number;
  timeoutsCount: number;
  fallbacksCount: number;
  humanDecisionsCount?: number;
  participationMultiplier?: number;
  unadjustedTpi?: number;
  timeoutPenaltyPoints?: number;
}

export interface FinalResult {
  cps: number; // Composite Preparedness Score (0 - 100)
  tpi: number; // Team Performance Index (0 - 100)
  tpiDetails?: TpiCalculationDetails;
  pathway: ScenarioOutcome;
  rating: PreparednessRating;
  endingTier: EndingTier;
  failureStates: FailureStates;
  breakdown: {
    floodPreparedness: number;
    droughtPreparedness: number;
    resourceScore: number;
    informationQuality: number;
    communityTrust: number;
    decisionQuality: number;
  };
  tradeoffs: string[];
  summary: string;
  explanation?: string;
  calculationDetails?: ScoreCalculationDetails;
  humanDecisionsCount?: number;
  fallbackInterventionsCount?: number;
  timeoutsCount?: number;
  isAllTimeoutFailure?: boolean;
}

