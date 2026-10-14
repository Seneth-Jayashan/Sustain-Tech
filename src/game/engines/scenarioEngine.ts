import { GameState } from '../state';
import { SCENARIOS, BucketScenario } from '../scenario';
import { findAction } from '../engine';
import { ACTION_MATRIX } from '../matrix';
import { getDefaultBucketShuffledOrder, getShuffledActionIds } from '../timer';
import Scenario, { IScenario } from '@/models/Scenario';
import Action from '@/models/Action';

export async function determineNextScenario(state: GameState): Promise<any> {
  const currentBucket = state.bucket || 1;
  const staticScenario = SCENARIOS[currentBucket] || SCENARIOS[1];

  // Resolve or generate persisted shuffled card order for this bucket
  if (!state.shuffledCardOrders) {
    state.shuffledCardOrders = {};
  }
  let order = state.shuffledCardOrders[currentBucket];
  if (!order || order.length === 0) {
    order = getDefaultBucketShuffledOrder(state.seed || 'seed', currentBucket);
    state.shuffledCardOrders[currentBucket] = order;
  }

  const sortActionsByOrder = (actionsList: any[]) => {
    if (!order || order.length === 0) return actionsList;
    return [...actionsList].sort((a, b) => {
      const idxA = order.indexOf(a.id);
      const idxB = order.indexOf(b.id);
      if (idxA === -1 || idxB === -1) return 0;
      return idxA - idxB;
    });
  };

  try {
    // Attempt to find configured scenario in MongoDB
    const dbScenario = await Scenario.findOne({
      $or: [
        { scenarioId: staticScenario.scenarioId },
        { priority: 100 - (currentBucket - 1) * 10 },
        { 'conditions.value': currentBucket }
      ]
    }).lean();

    if (dbScenario) {
      const scen: any = { ...dbScenario };
      if (scen.availableActionIds && scen.availableActionIds.length > 0) {
        const dbActions = await Action.find({ actionId: { $in: scen.availableActionIds } }).lean();
        if (dbActions.length > 0) {
          const rawActions = scen.availableActionIds.map((id: string) => {
            const found = dbActions.find((a: any) => a.actionId === id);
            const canonical = findAction(id, currentBucket) || ACTION_MATRIX.find(a => a.id === id);
            return {
              id,
              title: found?.title || canonical?.title || id,
              description: found?.description || canonical?.description || '',
              impacts: canonical?.impacts || (found as any)?.impacts,
              cost: canonical ? Math.abs(canonical.impacts.emergencyBudget) : 0,
            };
          });
          scen.actions = sortActionsByOrder(rawActions);
          return scen;
        }
      }
    }
  } catch (err) {
    console.warn('Could not query scenario from DB, falling back to static scenario:', err);
  }

  // Fallback directly to authoritative static scenario
  const staticActions = staticScenario.actions.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    impacts: a.impacts,
    cost: Math.abs(a.impacts.emergencyBudget)
  }));

  return {
    scenarioId: staticScenario.scenarioId,
    title: staticScenario.title,
    situation: staticScenario.situation,
    events: staticScenario.events,
    actions: sortActionsByOrder(staticActions)
  };
}

