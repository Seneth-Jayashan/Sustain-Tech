import { GameState } from '../state';
import { calculateDelta } from '../engine';

export async function calculateDecisionImpact(
  state: GameState,
  decision: { rankings?: string[]; allocations?: Record<string, number> } | string[]
): Promise<any> {
  if (Array.isArray(decision)) {
    return calculateDelta({ rankings: decision }, state.bucket, state);
  }
  return calculateDelta(decision, state.bucket, state);
}
