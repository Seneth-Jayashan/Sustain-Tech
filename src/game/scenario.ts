import { ActionId } from './types';
import { ACTION_MATRIX } from './matrix';

export interface BucketScenario {
  bucket: number;
  day: number;
  title: string;
  situation: string;
  events: string[];
  actions: typeof ACTION_MATRIX;
}

export const SCENARIOS: Record<number, BucketScenario> = {
  1: {
    bucket: 1,
    day: 0,
    title: 'What Do You Do First?',
    situation: 'The first warning has arrived. There is no disaster yet. Some people believe the forecast; others say "we had warnings before, nothing happened." Budget is limited.',
    events: [
      'Current groundwater table: 4.2m below surface.',
      '40 hectares of paddy at the vegetative growth stage.',
      'Emergency budget: LKR 500,000.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 1)
  },
  2: {
    bucket: 2,
    day: 2,
    title: 'The First Signal',
    situation: 'Rainfall has been detected but is unevenly distributed. Local sources are unchanged so far. Social media is full of conflicting claims.',
    events: [
      'Station 1: 80 mm | Station 2: 5 mm | Station 3: 0 mm | Station 4: 45 mm',
      'Three unofficial WhatsApp groups are circulating conflicting rainfall claims.',
      'Farmers asking whether to delay fertilizer.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 2)
  },
  3: {
    bucket: 3,
    day: 4,
    title: 'The Resource Problem',
    situation: 'The emergency budget is shrinking. Three groups compete for it: farmers, households, and disaster officers.',
    events: [
      'Farmers request LKR 300,000 for irrigation.',
      'Livestock need 3,000 L/day minimum.',
      'Total requests: LKR 750,000 against a limited budget.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 3)
  },
  4: {
    bucket: 4,
    day: 6,
    title: 'The Forecast Changes',
    situation: 'Flood probability has risen. Water levels remain low in places. A dry area could suddenly flood.',
    events: [
      'Rapid wetting of dry soil after a long dry spell sharply increases surface runoff.',
      'Paddy at vegetative stage can benefit from moderate flooding, but deep flooding causes yield loss.',
      'A trend-line from the last 3 days of rainfall flags a direction change.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 4)
  },
  5: {
    bucket: 5,
    day: 8,
    title: 'The Warning',
    situation: 'Rainfall is rising in some areas and streams are rising. Other areas still report falling wells. Two competing reports arrive.',
    events: [
      'Rising river water is picking up surface contaminants.',
      'Livestock owners in drought-affected pockets are trucking in water.',
      'Time to flood: ~3.5 hours. Time to well failure: 18 days.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 5)
  },
  6: {
    bucket: 6,
    day: 10,
    title: 'The Final Decision',
    situation: 'The final briefing arrives: rainfall, river levels, groundwater levels, reservoir levels, satellite data, community reports, road conditions, and water demand — all at once, still with no certainty.',
    events: [
      'Cumulative 10-day rainfall and current groundwater trend lines established.',
      'End-of-window snapshot received for irrigated areas.',
      'All 8 data streams available.'
    ],
    actions: ACTION_MATRIX.filter(a => a.bucket === 6)
  }
};
