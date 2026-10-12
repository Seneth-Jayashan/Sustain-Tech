import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Action from '../src/models/Action';
import Scenario from '../src/models/Scenario';
import Event from '../src/models/Event';
import { ACTION_MATRIX } from '../src/game/matrix';
import { SCENARIOS } from '../src/game/scenario';

dotenv.config({ path: '.env' });

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for config seeding');

  // Clear existing configs for clean slate
  await Action.deleteMany({});
  await Scenario.deleteMany({});
  await Event.deleteMany({});

  // Seed Actions directly from authoritative ACTION_MATRIX
  const actionsToInsert = ACTION_MATRIX.map(a => {
    const scen = (SCENARIOS as any)[`bucket_${a.bucket}`];
    return {
      actionId: a.id,
      scenarioId: scen ? scen.scenarioId : `scenario_day_${(a.bucket - 1) * 2}`,
      title: a.title,
      description: a.description,
      baseImpacts: {
        floodPreparedness: a.impacts.floodPreparedness,
        droughtPreparedness: a.impacts.droughtPreparedness,
        emergencyBudget: a.impacts.emergencyBudget,
        communityTrust: a.impacts.communityTrust,
        informationQuality: a.impacts.informationQuality,
      },
      contextMultipliers: []
    };
  });

  await Action.insertMany(actionsToInsert);
  console.log(`Successfully seeded ${actionsToInsert.length} Actions from 10 Days to Decide`);

  // Seed Scenarios directly from authoritative SCENARIOS
  const scenariosToInsert = Object.values(SCENARIOS).map(s => ({
    scenarioId: s.scenarioId,
    title: s.title,
    situation: s.situation,
    priority: 100 - (s.bucket - 1) * 10,
    conditions: [{ field: 'bucket', operator: '===', value: s.bucket }],
    availableActionIds: s.actions.map(a => a.id)
  }));

  await Scenario.insertMany(scenariosToInsert);
  console.log(`Successfully seeded ${scenariosToInsert.length} Scenarios from 10 Days to Decide`);

  // Seed narrative events
  const events = [
    {
      eventId: 'DEPRESSION_FORMED',
      type: 'WEATHER',
      description: 'Depression forming over Bay of Bengal; flood and drought risks compounded.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 1 }],
      effects: [
        { field: 'risks.floodRisk', delta: 10 },
        { field: 'risks.droughtRisk', delta: 10 }
      ]
    },
    {
      eventId: 'KELANI_SPILL',
      type: 'HAZARD',
      description: 'Kelani river reaches spill level at downstream gauges.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 4 }],
      effects: [
        { field: 'risks.floodRisk', delta: 25 },
        { field: 'operations.transportation', delta: -15 }
      ]
    },
    {
      eventId: 'LANDSLIDES_ACTIVE',
      type: 'HAZARD',
      description: 'Landslides sever transport corridors in Ratnapura and Kalutara.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 5 }],
      effects: [
        { field: 'risks.landslideRisk', delta: 30 },
        { field: 'operations.communication', delta: -20 }
      ]
    }
  ];

  await Event.insertMany(events);
  console.log(`Successfully seeded ${events.length} narrative Events`);

  await mongoose.disconnect();
  console.log('Finished config seeding.');
}

main().catch(console.error);
