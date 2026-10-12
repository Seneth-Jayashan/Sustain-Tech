import { GameState } from '../state';
import { SCENARIOS, BucketScenario } from '../scenario';
import Scenario, { IScenario } from '@/models/Scenario';
import Action from '@/models/Action';

export async function determineNextScenario(state: GameState): Promise<any> {
  const currentBucket = state.bucket || 1;
  const staticScenario = SCENARIOS[currentBucket] || SCENARIOS[1];

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
          // Preserve order of availableActionIds
          scen.actions = scen.availableActionIds.map((id: string) => {
            const found = dbActions.find((a: any) => a.actionId === id);
            return {
              id,
              title: found?.title || id,
              description: found?.description || ''
            };
          });
          return scen;
        }
      }
    }
  } catch (err) {
    console.warn('Could not query scenario from DB, falling back to static scenario:', err);
  }

  // Fallback directly to authoritative static scenario
  return {
    scenarioId: staticScenario.scenarioId,
    title: staticScenario.title,
    situation: staticScenario.situation,
    events: staticScenario.events,
    actions: staticScenario.actions.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description
    }))
  };
}
