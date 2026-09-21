import { GameState } from '../state';
import Action, { IAction } from '@/models/Action';

// Rank multipliers (Rank 1 -> 1.00, Rank 5 -> 0.20)
const RANK_MULTIPLIERS = [1.0, 0.8, 0.6, 0.4, 0.2];

function evaluateContextMultiplier(state: any, condition: any): number {
  const keys = condition.field.split('.');
  let value = state;
  for (const k of keys) {
    if (value === undefined) return 1.0;
    value = value[k];
  }

  let matches = false;
  switch (condition.operator) {
    case '>': matches = value > condition.value; break;
    case '<': matches = value < condition.value; break;
    case '===': matches = value === condition.value; break;
  }
  
  return matches ? condition.multiplier : 1.0;
}

export async function calculateDecisionImpact(state: GameState, rankedActionIds: string[]): Promise<any> {
  const delta: any = {};

  for (let i = 0; i < rankedActionIds.length; i++) {
    const actionId = rankedActionIds[i];
    const rankMultiplier = RANK_MULTIPLIERS[i] || 0;

    const action = await Action.findOne({ actionId }).lean();
    if (!action) continue;

    // Calculate context multiplier
    let contextMultiplier = 1.0;
    if (action.contextMultipliers) {
      for (const cm of action.contextMultipliers) {
        contextMultiplier *= evaluateContextMultiplier(state, cm);
      }
    }

    const effectiveMultiplier = rankMultiplier * contextMultiplier;

    // Apply base impacts
    if (action.baseImpacts) {
      for (const [key, value] of Object.entries(action.baseImpacts)) {
        if (!delta[key]) delta[key] = 0;
        delta[key] += (value as number) * effectiveMultiplier;
      }
    }
  }

  return delta;
}
