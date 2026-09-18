import { ActionId, BucketDecision, GameState, HiddenVariables, FinalResult } from './types';
import { ACTION_MATRIX, RANK_WEIGHTS } from './matrix';

export function calculateDelta(rankings: ActionId[]): HiddenVariables {
  const delta: HiddenVariables = { F: 0, D: 0, R: 0, I: 0, C: 0, Q: 0 };
  
  rankings.forEach((actionId, index) => {
    const action = ACTION_MATRIX.find(a => a.id === actionId);
    if (!action) return;
    
    const weight = RANK_WEIGHTS[index] || 0;
    
    delta.F += action.impacts.F * weight;
    delta.D += action.impacts.D * weight;
    delta.R += action.impacts.R * weight;
    delta.I += action.impacts.I * weight;
    delta.C += action.impacts.C * weight;
    delta.Q += action.impacts.Q * weight;
  });
  
  return delta;
}

export function applyDecision(state: GameState, decision: BucketDecision): GameState {
  const delta = calculateDelta(decision.rankings);
  
  const newState: GameState = {
    ...state,
    variables: {
      F: state.variables.F + delta.F,
      D: state.variables.D + delta.D,
      R: state.variables.R + delta.R,
      I: state.variables.I + delta.I,
      C: state.variables.C + delta.C,
      Q: state.variables.Q + delta.Q,
    },
    decisions: [...state.decisions, decision]
  };
  
  // Example simplistic resource logic based on R delta (can be tweaked)
  newState.budget += (delta.R * 10000); // 1 point of R = 10,000 LKR
  newState.budget = Math.max(0, newState.budget);
  
  // Advance to next bucket/day
  newState.currentBucket += 1;
  newState.currentDay = (newState.currentBucket - 1) * 2;
  
  return newState;
}

export function getInitialState(): GameState {
  return {
    currentDay: 0,
    currentBucket: 1,
    variables: { F: 50, D: 50, R: 50, I: 50, C: 50, Q: 50 }, // Starting baseline
    budget: 500000,
    waterStorage: 1800,
    waterCapacity: 5000,
    decisions: []
  };
}

export function calculateFinalOutcome(state: GameState): FinalResult {
  const { F, D, R, I, C, Q } = state.variables;
  const cps = (0.30 * F) + (0.30 * D) + (0.15 * R) + (0.10 * I) + (0.10 * C) + (0.05 * Q);
  
  const pathway = D > F ? 'Drought' : 'Flood';
  
  let rating: FinalResult['rating'] = 'Critical';
  if (cps >= 85) rating = 'Excellent';
  else if (cps >= 70) rating = 'Good';
  else if (cps >= 50) rating = 'Moderate';
  else if (cps >= 30) rating = 'Poor';
  
  return { cps, pathway, rating };
}
