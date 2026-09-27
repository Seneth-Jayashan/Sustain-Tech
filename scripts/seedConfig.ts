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
    // S1_START (Day 0)
    { actionId: '1A', title: 'Inspect water sources and identify vulnerable communities', description: 'Primary anchor: A preliminary information/needs check is a low-regret action.', baseImpacts: { floodPreparedness: 2, droughtPreparedness: 3, emergencyBudget: -10, communityTrust: 2, informationQuality: 5 }, contextMultipliers: [] },
    { actionId: '1B', title: 'Purchase a large emergency stock of bottled water immediately', description: 'Useful but over-commits budget early.', baseImpacts: { floodPreparedness: 0, droughtPreparedness: 5, emergencyBudget: -100, communityTrust: 2, informationQuality: 0 }, contextMultipliers: [] },
    { actionId: '1C', title: 'Clear priority drainage channels in flood-prone communities', description: 'Defensible preventive action.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 0, emergencyBudget: -50, communityTrust: 1, informationQuality: 0 }, contextMultipliers: [] },
    { actionId: '1D', title: 'Communicate uncertainty and preparedness guidance to communities', description: 'Secondary scoring anchor.', baseImpacts: { floodPreparedness: 2, droughtPreparedness: 2, emergencyBudget: -5, communityTrust: 5, informationQuality: 3 }, contextMultipliers: [] },
    { actionId: '1E', title: 'Wait for a more certain forecast before acting', description: 'Intentionally weak choice; loses lead time.', baseImpacts: { floodPreparedness: -2, droughtPreparedness: -2, emergencyBudget: 0, communityTrust: -2, decisionQuality: -5 }, contextMultipliers: [] },

    // S2_DUAL (Day 2)
    { actionId: '2A', title: 'Depend mainly on social-media reports because they arrive fastest', description: 'Weak information strategy.', baseImpacts: { informationQuality: -5, communityTrust: -2, decisionQuality: -4 }, contextMultipliers: [] },
    { actionId: '2B', title: 'Combine official forecasts, river/reservoir observations and verified local reports', description: 'Primary scoring anchor: Data-fusion approach.', baseImpacts: { floodPreparedness: 3, droughtPreparedness: 3, emergencyBudget: -15, informationQuality: 6, communityTrust: 2 }, contextMultipliers: [] },
    { actionId: '2C', title: 'Spend most of the emergency budget immediately on both hazards', description: 'Overreactive under uncertainty.', baseImpacts: { floodPreparedness: 4, droughtPreparedness: 4, emergencyBudget: -200, informationQuality: 0, decisionQuality: -2 }, contextMultipliers: [] },
    { actionId: '2D', title: 'Wait until flooding becomes severe before activating response measures', description: 'Weak choice; sacrifices lead time.', baseImpacts: { floodPreparedness: -5, droughtPreparedness: -2, emergencyBudget: 0, informationQuality: -2, communityTrust: -3 }, contextMultipliers: [] },
    { actionId: '2E', title: 'Establish a district-level monitoring network involving local authorities and community observers', description: 'Secondary scoring anchor.', baseImpacts: { floodPreparedness: 2, droughtPreparedness: 2, emergencyBudget: -25, informationQuality: 5, communityTrust: 4 }, contextMultipliers: [] },

    // S3_CALC (Day 4)
    { actionId: '3A', title: 'Allocate LKR 40M evacuation + LKR 30M water + LKR 30M medical', description: 'Primary scoring anchor: Exposes the 20M water trade-off while meeting immediate needs.', baseImpacts: { floodPreparedness: 4, droughtPreparedness: 3, emergencyBudget: -100, communityTrust: 3, decisionQuality: 5, healthRisk: -3 }, contextMultipliers: [] },
    { actionId: '3B', title: 'Allocate LKR 60M evacuation + LKR 40M water + LKR 0M medical', description: 'Weak/imbalanced: Deliberate high-risk trade-off leaving no medical allocation.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 4, emergencyBudget: -100, communityTrust: -1, decisionQuality: -3, healthRisk: 5 }, contextMultipliers: [] },
    { actionId: '3C', title: 'Allocate LKR 40M evacuation + LKR 50M water + LKR 10M medical', description: 'Defensible alternative if health needs are lower than stated.', baseImpacts: { floodPreparedness: 4, droughtPreparedness: 5, emergencyBudget: -100, communityTrust: 2, decisionQuality: 2, healthRisk: 2 }, contextMultipliers: [] },
    { actionId: '3D', title: 'Allocate LKR 30M evacuation + LKR 40M water + LKR 30M medical', description: 'Secondary defensible choice if access/medical risk is emphasized.', baseImpacts: { floodPreparedness: 2, droughtPreparedness: 4, emergencyBudget: -100, communityTrust: 1, decisionQuality: 3, healthRisk: -3 }, contextMultipliers: [] },
    { actionId: '3E', title: 'Release the full LKR 120M despite having only LKR 100M', description: 'Invalid under game rules.', baseImpacts: { emergencyBudget: -120, communityTrust: -5, decisionQuality: -10 }, contextMultipliers: [] },

    // S4_LOGISTICS (Day 6)
    { actionId: '4A', title: 'Deploy 30 trucks for flood rescue and 20 for water delivery', description: 'Primary scoring anchor.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 3, emergencyBudget: -20, communityTrust: 4, transportation: -5, decisionQuality: 5 }, contextMultipliers: [] },
    { actionId: '4B', title: 'Deploy all 50 trucks for flood rescue', description: 'Hazard-specialist but imbalanced.', baseImpacts: { floodPreparedness: 8, droughtPreparedness: -5, emergencyBudget: -20, communityTrust: -2, transportation: -5, decisionQuality: -2 }, contextMultipliers: [] },
    { actionId: '4C', title: 'Deploy all 50 trucks for water delivery', description: 'Hazard-specialist but imbalanced.', baseImpacts: { floodPreparedness: -5, droughtPreparedness: 8, emergencyBudget: -20, communityTrust: -2, transportation: -5, decisionQuality: -2 }, contextMultipliers: [] },
    { actionId: '4D', title: 'Attempt to deploy 60 trucks by using vehicles that have not completed maintenance', description: 'Invalid/unsafe over-capacity option.', baseImpacts: { floodPreparedness: 2, droughtPreparedness: 2, emergencyBudget: -15, communityTrust: -4, decisionQuality: -10, transportation: -15 }, contextMultipliers: [] },
    { actionId: '4E', title: 'Hold the trucks and wait for external transport assistance', description: 'Weak under immediate threat.', baseImpacts: { floodPreparedness: -4, droughtPreparedness: -3, emergencyBudget: 0, communityTrust: -4, decisionQuality: -5 }, contextMultipliers: [] },

    // S5_DISASTER (Day 8)
    { actionId: '5A', title: 'Order evacuation of people in identified high-risk flood and landslide zones', description: 'Primary scoring anchor: Life safety.', baseImpacts: { floodPreparedness: 6, emergencyBudget: -40, communityTrust: 3, decisionQuality: 5, healthRisk: -5 }, contextMultipliers: [] },
    { actionId: '5B', title: 'Use aircraft to airdrop drinking water to every affected dry-zone community', description: 'Conditional / situational (inefficient universal application).', baseImpacts: { droughtPreparedness: 5, emergencyBudget: -150, communityTrust: 2, decisionQuality: -2, transportation: -10 }, contextMultipliers: [] },
    { actionId: '5C', title: 'Establish emergency coordination and triage points serving both hazard zones', description: 'Secondary scoring anchor.', baseImpacts: { floodPreparedness: 3, droughtPreparedness: 3, emergencyBudget: -30, communityTrust: 5, decisionQuality: 4, healthRisk: -4, communications: 5 }, contextMultipliers: [] },
    { actionId: '5D', title: 'Evacuate only residents who volunteer', description: 'Weak under identified high risk.', baseImpacts: { floodPreparedness: -3, emergencyBudget: -10, communityTrust: 0, decisionQuality: -6, healthRisk: 5 }, contextMultipliers: [] },
    { actionId: '5E', title: 'Suspend non-essential government expenditure and redirect available funds to emergency response', description: 'Secondary/conditional strategic trade-off.', baseImpacts: { emergencyBudget: 200, communityTrust: -3, decisionQuality: 2, communications: -5 }, contextMultipliers: [] },

    // S6_AFTERMATH (Day 10)
    { actionId: '6A', title: 'Conduct a rapid multi-sector damage and needs assessment, then prioritize WASH, health, transport and shelter recovery', description: 'Primary scoring anchor.', baseImpacts: { floodPreparedness: 4, droughtPreparedness: 4, emergencyBudget: -50, communityTrust: 6, decisionQuality: 6, informationQuality: 8 }, contextMultipliers: [] },
    { actionId: '6B', title: 'Restore critical roads, clear debris and rehabilitate damaged water infrastructure', description: 'Strong operational follow-up.', baseImpacts: { floodPreparedness: 5, droughtPreparedness: 3, emergencyBudget: -80, communityTrust: 5, decisionQuality: 4, transportation: 15 }, contextMultipliers: [] },
    { actionId: '6C', title: 'Strengthen disease surveillance, safe water, sanitation and emergency health services', description: 'Strong secondary action.', baseImpacts: { healthRisk: -10, emergencyBudget: -40, communityTrust: 5, decisionQuality: 4 }, contextMultipliers: [] },
    { actionId: '6D', title: 'Strictly ration all remaining food and water without reassessing community needs', description: 'Weak unless triggered by scarcity state.', baseImpacts: { foodSecurity: 2, emergencyBudget: 0, communityTrust: -5, decisionQuality: -3 }, contextMultipliers: [] },
    { actionId: '6E', title: 'Request external assistance and coordinate donor/partner support against a documented needs list', description: 'Strong secondary action.', baseImpacts: { emergencyBudget: 300, communityTrust: 3, decisionQuality: 5 }, contextMultipliers: [] },
  ];

  await Action.insertMany(actions);
  console.log('Actions inserted');

  const scenarios = [
    {
      scenarioId: 'S1_START',
      title: 'Day 0: Early Warning and Uncertainty',
      situation: 'A developing low-pressure system over the Bay of Bengal may produce heavy rainfall over parts of Sri Lanka during the coming days. Forecast confidence is moderate. At the same time, some dry-zone communities report continuing water stress after a prolonged dry period. You have a fictional emergency allocation of LKR 500 million. What should you do first?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 1 }],
      availableActionIds: ['1A', '1B', '1C', '1D', '1E']
    },
    {
      scenarioId: 'S2_DUAL',
      title: 'Day 2: The Compound Hazard',
      situation: 'Rainfall in one part of the country has reached approximately 150 mm in 24 hours, creating localized flooding. At the same time, dry-zone communities report continuing water shortages. Which information and response strategy should you adopt?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 2 }],
      availableActionIds: ['2A', '2B', '2C', '2D', '2E']
    },
    {
      scenarioId: 'S3_CALC',
      title: 'Day 4: The LKR 100 Million Constraint',
      situation: 'Three immediate requirements are identified: LKR 40M for Kelani-area evacuation support, LKR 50M for dry-zone drinking-water response, and LKR 30M for emergency medical supplies. Total identified requirements are LKR 120M, but the fictional allocation available this round is only LKR 100M. You cannot fully fund all three. How do you allocate the available funds?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 3 }],
      availableActionIds: ['3A', '3B', '3C', '3D', '3E']
    },
    {
      scenarioId: 'S4_LOGISTICS',
      title: 'Day 6: Fifty Trucks, Two Emergencies',
      situation: 'The Kelani basin is experiencing serious flooding while dry-zone communities require emergency drinking water. You have exactly 50 heavy-duty trucks nationwide. The flood-rescue plan needs 30 trucks and the water-delivery plan needs 20 trucks. How should the trucks be deployed?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 4 }],
      availableActionIds: ['4A', '4B', '4C', '4D', '4E']
    },
    {
      scenarioId: 'S5_DISASTER',
      title: 'Day 8: The Breaking Point',
      situation: 'Heavy rain has triggered landslides in parts of Ratnapura and Kalutara. At the same time, several dry-zone communities have severe drinking-water shortages, roads are difficult to access, and parts of the telecommunications network have failed. What should be prioritized?',
      priority: 100,
      conditions: [{ field: 'bucket', operator: '===', value: 5 }],
      availableActionIds: ['5A', '5B', '5C', '5D', '5E']
    },
    {
      scenarioId: 'S6_AFTERMATH',
      title: 'Day 10: From Emergency Response to Recovery',
      situation: 'The immediate weather threat is weakening. Initial assessments show damaged roads and bridges, contaminated or unsafe domestic water sources, damaged water-supply systems, disrupted communications, displaced households, and increased public-health risk. What should the administration do next?',
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
        { field: 'operations.transportation', delta: -20 },
        { field: 'risks.healthRisk', delta: 10 }
      ]
    },
    {
      eventId: 'CROP_FAILURE',
      type: 'HAZARD',
      description: 'Crop-damage and food-security disruption confirmed.',
      probability: 1.0,
      conditions: [{ field: 'bucket', operator: '===', value: 5 }],
      effects: [
        { field: 'risks.droughtRisk', delta: 20 },
        { field: 'operations.foodSecurity', delta: -30 }
      ]
    }
  ];

  await Event.insertMany(events);
  console.log('Events inserted');

  await mongoose.disconnect();
}

main().catch(console.error);
