import { Action } from './types';
import { ACTION_MATRIX } from './matrix';

export interface BucketScenario {
  bucket: number;
  day: number;
  scenarioId: string;
  title: string;
  situation: string;
  events: string[];
  actions: Action[];
}

export const SCENARIOS: Record<number, BucketScenario> = {
  1: {
    bucket: 1,
    day: 0,
    scenarioId: 'S1_START',
    title: 'Day 0: Early Warning and Uncertainty',
    situation: 'A weather system may bring heavy rain to the western slopes of the Central Highlands and flood-prone areas of Sri Lanka over the next few days. However, we are not completely sure how strong the rainfall will be. At the same time, some communities in the Dry Zone are still facing a shortage of drinking water after a long dry period. You have a fictional emergency budget of LKR 500 million. Select the sequence in which you would make the following decisions, from first to last.',
    events: [
      'Depression detected over the Bay of Bengal; satellite confidence moderate.',
      'Western slopes on elevated flood alert; Dry-Zone reservoirs at seasonal lows.',
      'Emergency Treasury Balance: LKR 500 Million.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 1)
  },
  2: {
    bucket: 2,
    day: 2,
    scenarioId: 'S2_DUAL',
    title: 'Day 2: Compound Hazard',
    situation: 'Rainfall in the western slopes of the Central Highlands and other flood-prone areas of the country has reached approximately 150 mm within 24 hours, causing localized flooding. At the same time, communities in the Dry Zone continue to report severe water shortages due to prolonged drought conditions. The situation is now developing in both areas. Based on the available information, make your next decisions and prioritize your actions accordingly.',
    events: [
      'Western river catchments record ~150 mm rainfall in 24 hours.',
      'Dry-Zone divisional secretariats report acute drinking water deficits.',
      'Unverified social media alerts and panic reports circulating online.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 2)
  },
  3: {
    bucket: 3,
    day: 4,
    scenarioId: 'S3_CALC',
    title: 'Day 4: Allocating LKR 100M Against LKR 120M of Needs',
    situation: 'After 150 mm of rainfall within the last 24 hours in flood-prone areas, three immediate requirements have been identified: LKR 40 million for evacuation support in the Kelani area, LKR 50 million for drinking-water requirements in the Dry Zone, and LKR 30 million for emergency medical supplies. The total identified requirement is LKR 120 million, but the fictional allocation available in this round is only LKR 100 million. Therefore, you cannot fully fund all three requirements. How would you allocate the available LKR 100 million?',
    events: [
      'Kelani river water levels approaching minor flood thresholds.',
      'Total immediate funding requests: LKR 120M against round allowance of LKR 100M.',
      'High-stakes trade-offs between evacuation, water bowsers, and medical triage.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 3)
  },
  4: {
    bucket: 4,
    day: 6,
    scenarioId: 'S4_LOGISTICS',
    title: 'Day 6: Trucks, Rescue Vehicles and Boats',
    situation: 'Emergency Operations:\n1. Flood-Rescue Operation: The Kelani Basin is experiencing serious flooding, requiring immediate evacuation and rescue support.\n2. Dry-Zone Water-Delivery Operation: Communities in the Dry Zone require emergency drinking water following prolonged dry conditions.\nThe country has limited emergency transport and rescue resources available for immediate deployment: 20 heavy-duty trucks, 30 rescue vehicles, 20 rescue boats. How would you allocate the available trucks, rescue vehicles, and boats between the two operations?',
    events: [
      'Major spill levels reported across downstream Kelani river basins.',
      'National assets available: 20 Heavy Trucks, 30 Rescue Vehicles, 20 Rescue Boats.',
      'Boats only operate in flooded terrain; heavy trucks needed for bulk water haulage.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 4)
  },
  5: {
    bucket: 5,
    day: 8,
    scenarioId: 'S5_DISASTER',
    title: 'Day 8: Landslides, Blocked Roads, Telecom Failure and Dry-Zone Shortage',
    situation: 'After several days of heavy rain, some areas of Sri Lanka are facing serious problems. Landslides have occurred in parts of Ratnapura and Kalutara, putting people and houses at risk. Some roads are blocked, making it difficult for emergency teams to reach affected communities. In addition, parts of the telephone and communication network have stopped working, making it difficult for authorities to communicate with some communities. At the same time, several Dry-Zone communities are facing severe shortages of drinking water because of the long dry period. Some areas are also difficult to reach because of poor road conditions. You have limited emergency resources and cannot solve all problems at the same time. What should you prioritize first?',
    events: [
      'NBRO issues high-level landslide evacuation warnings for Ratnapura and Kalutara.',
      'A7 highway and regional mountain arteries severed by landslides and debris.',
      'Cellular tower blackouts reported; acute water shortages intensify in Dry Zone.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 5)
  },
  6: {
    bucket: 6,
    day: 10,
    scenarioId: 'S6_AFTERMATH',
    title: 'Day 10: From Emergency Response to Recovery',
    situation: 'The heavy rain has now decreased, and the immediate danger is becoming lower. Emergency teams have completed many rescue and evacuation activities. However, the affected communities still have many problems. Initial assessments show that: Some roads and bridges are damaged, making travel difficult. Some wells and other domestic water sources are contaminated or unsafe. Several water-supply systems are damaged. Telephone and communication services are still disrupted in some areas. Some families have lost their homes and need temporary shelter and basic supplies. There is an increased risk of diseases and other public-health problems because of unsafe water and poor sanitation. The administration now needs to move from emergency rescue to recovery and restoring essential services. What should the administration do next?',
    events: [
      'Flood waters receding; emergency search-and-rescue operations winding down.',
      'High contamination of domestic wells; heightened risk of Dengue and waterborne disease.',
      'Transition phase: shift focus to infrastructure rehabilitation and community recovery.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 6)
  }
};
