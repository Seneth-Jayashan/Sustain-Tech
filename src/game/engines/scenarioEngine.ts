import { GameState } from '../state';
import Scenario, { IScenario } from '@/models/Scenario';

function evaluateCondition(state: any, condition: any): boolean {
  const keys = condition.field.split('.');
  let value = state;
  for (const k of keys) {
    if (value === undefined) return false;
    value = value[k];
  }

  switch (condition.operator) {
    case '>': return value > condition.value;
    case '<': return value < condition.value;
    case '===': return value === condition.value;
    default: return false;
  }
}

export async function determineNextScenario(state: GameState): Promise<IScenario> {
  const scenarios = await Scenario.find({}).sort({ priority: -1 }).lean();

  for (const scen of scenarios) {
    let allMet = true;
    if (scen.conditions && scen.conditions.length > 0) {
      for (const cond of scen.conditions) {
        if (!evaluateCondition(state, cond)) {
          allMet = false;
          break;
        }
      }
    }
    
    if (allMet) {
      return scen as unknown as IScenario;
    }
  }

  // Fallback if nothing matches
  const defaultScen = await Scenario.findOne({ scenarioId: 'S1_DEFAULT' }).lean();
  if (!defaultScen) throw new Error("No scenarios matched and S1_DEFAULT is missing");
  return defaultScen as unknown as IScenario;
}
