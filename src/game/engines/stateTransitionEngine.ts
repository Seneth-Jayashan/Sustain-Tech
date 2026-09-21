import { GameState } from '../state';
import { calculateDecisionImpact } from './decisionEngine';
import { determineNextScenario } from './scenarioEngine';

export async function processDecision(
  state: GameState, 
  userId: string, 
  rankings: string[]
): Promise<GameState> {
  // 1. Calculate Decision Impact
  const delta = await calculateDecisionImpact(state, rankings);

  // 2. Clone state for mutation
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  // Apply deltas based on keys matching state structure
  // In a real system, you'd map these strictly. For this PoC, we apply them to resources/scores
  if (delta.floodPreparedness) newState.scores.floodPreparedness = Math.max(0, Math.min(100, newState.scores.floodPreparedness + delta.floodPreparedness));
  if (delta.droughtPreparedness) newState.scores.droughtPreparedness = Math.max(0, Math.min(100, newState.scores.droughtPreparedness + delta.droughtPreparedness));
  if (delta.emergencyBudget) newState.resources.emergencyBudget = Math.max(0, newState.resources.emergencyBudget + delta.emergencyBudget);
  if (delta.drinkingWater) newState.resources.drinkingWater = Math.max(0, newState.resources.drinkingWater + delta.drinkingWater);
  if (delta.communityTrust) newState.community.communityTrust = Math.max(0, Math.min(100, newState.community.communityTrust + delta.communityTrust));
  if (delta.transportation) newState.operations.transportation = Math.max(0, Math.min(100, newState.operations.transportation + delta.transportation));

  // 3. Save Decision to History
  newState.decisionHistory.push({
    bucket: state.bucket,
    day: state.day,
    userId,
    rankings,
    timestamp: new Date()
  });

  // 4. Advance time
  newState.bucket += 1;
  newState.day += 2;

  // 5. Calculate Next Scenario (Note: we don't save the scenario to state yet, 
  // but it dictates what the client sees. The client fetches the current scenario 
  // dynamically based on the state in the next step or via a separate API).
  // Actually, to make it simple, we'll let the client or a separate route determine the scenario.
  
  return newState;
}
