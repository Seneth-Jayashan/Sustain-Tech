import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Action from '../src/models/Action';
import Scenario from '../src/models/Scenario';
import Event from '../src/models/Event';

dotenv.config({ path: '.env' });

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for config seeding');

  // Clear existing configs for a clean slate
  await Action.deleteMany({});
  await Scenario.deleteMany({});
  await Event.deleteMany({});

  const actions = [
    // BUCKET 1 (Day 0)
    { actionId: '1A', title: 'Inspect local water sources', description: '(wells, tank, stream)', baseImpacts: { floodPreparedness: 10, droughtPreparedness: 15, emergencyBudget: -5000, communityTrust: 5, informationQuality: 25 }, contextMultipliers: [] },
    { actionId: '1B', title: 'Purchase emergency drinking-water supplies', description: 'Direct drought hedge, but costly', baseImpacts: { floodPreparedness: 0, droughtPreparedness: 25, emergencyBudget: -20000, communityTrust: 10, informationQuality: 0 }, contextMultipliers: [] },
    { actionId: '1C', title: 'Clean and clear drainage channels', description: 'Direct flood hedge, but costly', baseImpacts: { floodPreparedness: 25, droughtPreparedness: 0, emergencyBudget: -15000, communityTrust: 5, informationQuality: 0 }, contextMultipliers: [] },
    { actionId: '1D', title: 'Inform the community about the uncertain forecast', description: 'Cheap; raises trust and awareness', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 5, emergencyBudget: -2000, communityTrust: 25, informationQuality: 15 }, contextMultipliers: [] },
    { actionId: '1E', title: 'Wait for a more accurate forecast', description: 'Saves budget now, costs decision quality', baseImpacts: { floodPreparedness: -5, droughtPreparedness: -5, emergencyBudget: 0, communityTrust: -10, decisionQuality: -15 }, contextMultipliers: [] },

    // BUCKET 2 (Day 2)
    { actionId: '2A', title: 'Depend mainly on social media reports', description: 'Fast but unverified', baseImpacts: { floodPreparedness: 0, droughtPreparedness: 0, informationQuality: -15, communityTrust: -5, decisionQuality: -10 }, contextMultipliers: [] },
    { actionId: '2B', title: 'Combine official forecasts with local observations', description: 'Data-fusion approach', baseImpacts: { floodPreparedness: 10, droughtPreparedness: 10, emergencyBudget: -5000, informationQuality: 20, communityTrust: 5 }, contextMultipliers: [] },
    { actionId: '2C', title: 'Immediately spend most of the emergency budget', description: 'Overreacts before evidence justifies it', baseImpacts: { floodPreparedness: 15, droughtPreparedness: 15, emergencyBudget: -25000, informationQuality: 0, communityTrust: -5 }, contextMultipliers: [] },
    { actionId: '2D', title: 'Ignore the warning until rainfall actually begins', description: 'Cheap now, costly in lost lead time', baseImpacts: { floodPreparedness: -10, droughtPreparedness: -10, emergencyBudget: 0, informationQuality: -5, communityTrust: -5 }, contextMultipliers: [] },
    { actionId: '2E', title: 'Establish a local monitoring team', description: 'Best long-run information investment', baseImpacts: { floodPreparedness: 10, droughtPreparedness: 10, emergencyBudget: -10000, informationQuality: 25, communityTrust: 10 }, contextMultipliers: [] },

    // BUCKET 3 (Day 4) - Calculation Focus
    { actionId: '3A', title: 'Allocate LKR 40M to Kelani Evacuation, LKR 50M to Dry Zone Bowsers, LKR 10M Meds', description: 'Exact 100M budget match. Balanced approach.', baseImpacts: { floodPreparedness: 20, droughtPreparedness: 25, emergencyBudget: -100000, communityTrust: 15, decisionQuality: 20 }, contextMultipliers: [] },
    { actionId: '3B', title: 'Allocate LKR 60M to Kelani Evacuation, LKR 40M to Dry Zone Bowsers', description: 'Leaves zero budget for medical supplies.', baseImpacts: { floodPreparedness: 30, droughtPreparedness: 20, emergencyBudget: -100000, communityTrust: 5, decisionQuality: 5 }, contextMultipliers: [] },
    { actionId: '3C', title: 'Allocate LKR 80M to Dry Zone Bowsers, LKR 20M to Kelani Evacuation', description: 'Ignores acute flood threat for drought.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 40, emergencyBudget: -100000, communityTrust: 5, decisionQuality: 5 }, contextMultipliers: [] },
    { actionId: '3D', title: 'Withhold LKR 30M in reserve, splitting 70M evenly', description: 'Safe but leaves current needs underfunded.', baseImpacts: { floodPreparedness: 15, droughtPreparedness: 15, emergencyBudget: -70000, communityTrust: 0, decisionQuality: 15 }, contextMultipliers: [] },
    { actionId: '3E', title: 'Request emergency foreign aid and overspend', description: 'High political cost, high delay.', baseImpacts: { floodPreparedness: 10, droughtPreparedness: 10, emergencyBudget: -120000, communityTrust: -15, decisionQuality: -10 }, contextMultipliers: [] },

    // BUCKET 4 (Day 6) - Logistics Calculation
    { actionId: '4A', title: 'Deploy 50 trucks: 30 for flood rescue, 20 for water delivery', description: 'Matches capacity limit exactly (50).', baseImpacts: { floodPreparedness: 25, droughtPreparedness: 15, emergencyBudget: -20000, communityTrust: 15, transportation: -50 }, contextMultipliers: [] },
    { actionId: '4B', title: 'Deploy all 50 trucks for flood rescue', description: 'Ignores drought completely.', baseImpacts: { floodPreparedness: 35, droughtPreparedness: -10, emergencyBudget: -20000, communityTrust: 0, transportation: -50 }, contextMultipliers: [] },
    { actionId: '4C', title: 'Deploy all 50 trucks for water delivery', description: 'Ignores flood rescue completely.', baseImpacts: { floodPreparedness: -10, droughtPreparedness: 35, emergencyBudget: -20000, communityTrust: 0, transportation: -50 }, contextMultipliers: [] },
    { actionId: '4D', title: 'Overload 60 trucks by bypassing maintenance', description: 'Risk of breakdowns during operations.', baseImpacts: { floodPreparedness: 30, droughtPreparedness: 20, emergencyBudget: -15000, communityTrust: -5, decisionQuality: -20, transportation: -60 }, contextMultipliers: [] },
    { actionId: '4E', title: 'Wait for military transport assistance (48hr delay)', description: 'Saves civilian trucks but costs time.', baseImpacts: { floodPreparedness: -10, droughtPreparedness: -5, emergencyBudget: 0, communityTrust: -15, decisionQuality: 10, transportation: 0 }, contextMultipliers: [] },

    // BUCKET 5 (Day 8)
    { actionId: '5A', title: 'Mandatory evacuation of Kelani riverbanks', description: 'High political friction, saves lives.', baseImpacts: { floodPreparedness: 25, droughtPreparedness: 0, emergencyBudget: -15000, communityTrust: -5, decisionQuality: 15 }, contextMultipliers: [] },
    { actionId: '5B', title: 'Airdrop water supplies to isolated dry zone villages', description: 'Extremely expensive but fast.', baseImpacts: { floodPreparedness: 0, droughtPreparedness: 25, emergencyBudget: -40000, communityTrust: 10, decisionQuality: 5 }, contextMultipliers: [] },
    { actionId: '5C', title: 'Establish localized triage centers for both zones', description: 'Balanced response.', baseImpacts: { floodPreparedness: 15, droughtPreparedness: 15, emergencyBudget: -20000, communityTrust: 15, decisionQuality: 15 }, contextMultipliers: [] },
    { actionId: '5D', title: 'Only evacuate those who volunteer', description: 'Low friction, high risk to life.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 0, emergencyBudget: -5000, communityTrust: 10, decisionQuality: -15 }, contextMultipliers: [] },
    { actionId: '5E', title: 'Halt all non-essential government services to divert funds', description: 'Massive disruption, high funds.', baseImpacts: { floodPreparedness: 20, droughtPreparedness: 20, emergencyBudget: +50000, communityTrust: -20, decisionQuality: -10 }, contextMultipliers: [] },

    // BUCKET 6 (Day 10)
    { actionId: '6A', title: 'Launch post-disaster recovery fund', description: 'Financial cleanup.', baseImpacts: { floodPreparedness: 10, droughtPreparedness: 10, emergencyBudget: -50000, communityTrust: 25, decisionQuality: 15 }, contextMultipliers: [] },
    { actionId: '6B', title: 'Deploy army for debris clearing and well rehabilitation', description: 'Infrastructure focus.', baseImpacts: { floodPreparedness: 15, droughtPreparedness: 15, emergencyBudget: -10000, communityTrust: 15, decisionQuality: 15 }, contextMultipliers: [] },
    { actionId: '6C', title: 'Focus on disease prevention (Dengue/Cholera outbreak)', description: 'Medical focus.', baseImpacts: { floodPreparedness: 20, droughtPreparedness: 20, emergencyBudget: -15000, communityTrust: 20, decisionQuality: 20 }, contextMultipliers: [] },
    { actionId: '6D', title: 'Ration remaining food and water strictly', description: 'Harsh but ensures survival.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 10, emergencyBudget: 0, communityTrust: -15, decisionQuality: 10 }, contextMultipliers: [] },
    { actionId: '6E', title: 'Declare national mourning and request international aid', description: 'Acceptance of loss.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 5, emergencyBudget: +100000, communityTrust: 5, decisionQuality: 5 }, contextMultipliers: [] },
  ];

  await Action.insertMany(actions);
  console.log('Actions inserted');

  const scenarios = [
    {
      scenarioId: 'S1_START',
      title: 'Day 0: Pre-Monsoon Anomalies (May 2017 Context)',
      situation: 'The Department of Meteorology has detected an unusually strong depression in the Bay of Bengal. Meanwhile, the dry zone is already suffering from a failed Maha season (2016). You have LKR 500M in your annual emergency budget.',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 1 }],
      availableActionIds: ['1A', '1B', '1C', '1D', '1E']
    },
    {
      scenarioId: 'S2_DUAL',
      title: 'Day 2: The Divergence',
      situation: 'Rainfall in the Southwestern slopes has exceeded 150mm in 24 hours. Simultaneously, Polonnaruwa and Anuradhapura report dropping reservoir levels and crop failure. You must choose how to allocate early resources.',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 2 }],
      availableActionIds: ['2A', '2B', '2C', '2D', '2E']
    },
    {
      scenarioId: 'S3_CALC',
      title: 'Day 4: Resource Allocation Mathematics',
      situation: 'CRITICAL CALCULATION: You must release LKR 100M from the emergency budget today. The Kelani river basin evacuation requires exactly 40M. Dry zone drinking water bowsers require 50M. Emergency medical supplies require 30M. Total requested: 120M. Total available: 100M. How do you allocate?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 3 }],
      availableActionIds: ['3A', '3B', '3C', '3D', '3E']
    },
    {
      scenarioId: 'S4_LOGISTICS',
      title: 'Day 6: Logistics Constraint',
      situation: 'CRITICAL CALCULATION: The Kelani River has reached spill level at Nagalagam Street. In the North Central province, 50,000 families have no drinking water. You have exactly 50 heavy-duty trucks available nationwide. Flood rescue needs 30 trucks. Water delivery needs 20 trucks. How do you deploy them?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 4 }],
      availableActionIds: ['4A', '4B', '4C', '4D', '4E']
    },
    {
      scenarioId: 'S5_DISASTER',
      title: 'Day 8: The Breaking Point',
      situation: 'Landslides reported in Kalutara and Ratnapura districts (mirroring 2017). Simultaneously, minor tanks in the dry zone have completely dried up. The system is overwhelmed. Political pressure is immense.',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 5 }],
      availableActionIds: ['5A', '5B', '5C', '5D', '5E']
    },
    {
      scenarioId: 'S6_AFTERMATH',
      title: 'Day 10: The Aftermath',
      situation: 'The immediate weather system is passing, but the destruction is vast. Over 600,000 people are affected by floods, and 1.2 million by drought. It is time to consolidate the recovery effort and face the final assessment.',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 6 }],
      availableActionIds: ['6A', '6B', '6C', '6D', '6E']
    }
  ];

  await Scenario.insertMany(scenarios);
  console.log('Scenarios inserted');

  const events = [
    {
      eventId: 'KELANI_SPILL',
      type: 'HAZARD',
      description: 'Kelani river reaches spill level at Nagalagam Street.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 4 }],
      effects: [
        { field: 'risks.floodRisk', delta: 30 },
        { field: 'operations.transportation', delta: -20 }
      ]
    },
    {
      eventId: 'MAHA_FAILURE',
      type: 'HAZARD',
      description: 'Total failure of the Maha season harvest confirmed.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 5 }],
      effects: [
        { field: 'risks.droughtRisk', delta: 30 },
        { field: 'community.foodSecurity', delta: -20 }
      ]
    }
  ];

  await Event.insertMany(events);
  console.log('Events inserted');

  await mongoose.disconnect();
}

main().catch(console.error);
