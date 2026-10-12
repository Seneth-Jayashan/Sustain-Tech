import { GameState } from '../state';
import { processDecision as engineProcessDecision } from '../engine';

export async function processDecision(
  state: GameState,
  userId: string,
  decision: string[] | { rankings?: string[]; allocations?: Record<string, number> }
): Promise<GameState> {
  const normalizedDecision = Array.isArray(decision) ? { rankings: decision } : decision;
  return engineProcessDecision(state, userId, normalizedDecision);
}
