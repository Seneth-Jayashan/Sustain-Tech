import { Action } from './types';

export const ACTION_MATRIX: Action[] = [
  // BUCKET 1
  { id: '1A', bucket: 1, title: 'Inspect local water sources', description: '(wells, tank, stream)', impacts: { F: 2, D: 3, R: -1, I: 5, C: 1, Q: 2 }, rationale: 'Builds the baseline data everything else depends on' },
  { id: '1B', bucket: 1, title: 'Purchase emergency drinking-water supplies', description: '', impacts: { F: 0, D: 5, R: -4, I: 0, C: 2, Q: 1 }, rationale: 'Direct drought hedge, but costly' },
  { id: '1C', bucket: 1, title: 'Clean and clear drainage channels', description: '', impacts: { F: 5, D: 0, R: -3, I: 0, C: 1, Q: 1 }, rationale: 'Direct flood hedge, but costly' },
  { id: '1D', bucket: 1, title: 'Inform the community about the uncertain forecast', description: '', impacts: { F: 1, D: 1, R: -1, I: 3, C: 5, Q: 2 }, rationale: 'Cheap; raises trust and awareness on both fronts' },
  { id: '1E', bucket: 1, title: 'Wait for a more accurate forecast', description: '', impacts: { F: -1, D: -1, R: 0, I: 0, C: -2, Q: -3 }, rationale: 'Saves budget now, costs decision quality and trust' },

  // BUCKET 2
  { id: '2A', bucket: 2, title: 'Depend mainly on social media reports', description: '', impacts: { F: 0, D: 0, R: 0, I: -3, C: -1, Q: -2 }, rationale: 'Fast but unverified -- hurts information quality' },
  { id: '2B', bucket: 2, title: 'Combine official forecasts with local observations', description: '', impacts: { F: 2, D: 2, R: -1, I: 4, C: 1, Q: 3 }, rationale: 'The data-fusion answer -- broadly positive' },
  { id: '2C', bucket: 2, title: 'Immediately spend most of the emergency budget', description: '', impacts: { F: 3, D: 3, R: -5, I: 0, C: -1, Q: -2 }, rationale: 'Overreacts before evidence justifies it' },
  { id: '2D', bucket: 2, title: 'Ignore the warning until rainfall actually begins', description: '', impacts: { F: -2, D: -2, R: 0, I: -1, C: -1, Q: -2 }, rationale: 'Cheap now, costly in lost lead time' },
  { id: '2E', bucket: 2, title: 'Establish a local monitoring team', description: '', impacts: { F: 2, D: 2, R: -2, I: 5, C: 2, Q: 3 }, rationale: 'Best long-run information investment in the game' },

  // BUCKET 3
  { id: '3A', bucket: 3, title: 'Reserve most available water for household drinking needs', description: '', impacts: { F: 0, D: 4, R: -2, I: 0, C: 2, Q: 2 }, rationale: 'Strong drought / human-need focus' },
  { id: '3B', bucket: 3, title: 'Allocate most water to agriculture', description: '', impacts: { F: 0, D: 3, R: -2, I: 0, C: 1, Q: 1 }, rationale: 'Protects livelihoods, less direct human-need coverage' },
  { id: '3C', bucket: 3, title: 'Keep a significant emergency reserve', description: '', impacts: { F: 2, D: 1, R: -1, I: 0, C: 0, Q: 3 }, rationale: 'Preserves optionality for whichever pathway occurs' },
  { id: '3D', bucket: 3, title: 'Spend the remaining budget on flood-protection activities', description: '', impacts: { F: 4, D: 0, R: -3, I: 0, C: 0, Q: 1 }, rationale: 'Strong flood focus, opportunity cost elsewhere' },
  { id: '3E', bucket: 3, title: 'Divide the resources equally among all groups', description: '', impacts: { F: 1, D: 1, R: -2, I: 0, C: 3, Q: -2 }, rationale: "Feels fair, but the Priority-Index math shows it's inefficient" },

  // BUCKET 4
  { id: '4A', bucket: 4, title: 'Continue following the original plan', description: '', impacts: { F: -2, D: 1, R: 0, I: -1, C: -1, Q: -3 }, rationale: 'Highest Expected Loss (65.5) -- ignores new evidence' },
  { id: '4B', bucket: 4, title: 'Shift all resources toward flood preparation', description: '', impacts: { F: 5, D: -2, R: -3, I: 0, C: 0, Q: 2 }, rationale: 'Lowest Expected Loss (34.25), but zero drought hedge' },
  { id: '4C', bucket: 4, title: 'Maintain a balanced preparedness strategy', description: '', impacts: { F: 3, D: 2, R: -2, I: 0, C: 1, Q: 3 }, rationale: 'Near-lowest EL (35.0) with much lower variance' },
  { id: '4D', bucket: 4, title: 'Wait until the forecast becomes almost certain', description: '', impacts: { F: -1, D: -1, R: 0, I: -1, C: -1, Q: -3 }, rationale: 'Costs response time for no informational gain here' },
  { id: '4E', bucket: 4, title: 'Conduct a rapid local risk assessment', description: '', impacts: { F: 2, D: 2, R: -1, I: 5, C: 1, Q: 3 }, rationale: 'Improves the inputs to every other decision this bucket' },

  // BUCKET 5
  { id: '5A', bucket: 5, title: 'Prepare evacuation and emergency transport', description: '', impacts: { F: 5, D: 0, R: -3, I: 0, C: 2, Q: 2 }, rationale: 'Matches the ~3.5-hour flood urgency' },
  { id: '5B', bucket: 5, title: 'Deliver drinking water to the most affected communities', description: '', impacts: { F: 0, D: 5, R: -3, I: 0, C: 2, Q: 1 }, rationale: 'Matches drought urgency, but it is >100x lower right now' },
  { id: '5C', bucket: 5, title: 'Protect wells and drinking-water sources from flood contamination', description: '', impacts: { F: 3, D: 2, R: -2, I: 0, C: 1, Q: 3 }, rationale: 'Hedges both — prevents a flood from also causing a water crisis' },
  { id: '5D', bucket: 5, title: 'Move emergency supplies to vulnerable locations', description: '', impacts: { F: 3, D: 1, R: -2, I: 0, C: 1, Q: 2 }, rationale: 'General-purpose readiness' },
  { id: '5E', bucket: 5, title: 'Wait for an official disaster declaration', description: '', impacts: { F: -3, D: -1, R: 0, I: -1, C: -2, Q: -3 }, rationale: 'Costs the most given a 3.5-hour window' },

  // BUCKET 6
  { id: '6A', bucket: 6, title: 'Prepare evacuation and flood-response operations', description: '', impacts: { F: 5, D: 0, R: -2, I: 0, C: 1, Q: 2 }, rationale: 'Direct flood-pathway action' },
  { id: '6B', bucket: 6, title: 'Secure drinking-water supplies', description: '', impacts: { F: 0, D: 5, R: -2, I: 0, C: 1, Q: 2 }, rationale: 'Direct drought-pathway action' },
  { id: '6C', bucket: 6, title: 'Protect critical infrastructure and roads', description: '', impacts: { F: 3, D: 1, R: -2, I: 0, C: 1, Q: 2 }, rationale: 'Mostly flood-side, some general value' },
  { id: '6D', bucket: 6, title: 'Preserve remaining water resources', description: '', impacts: { F: 1, D: 3, R: -1, I: 0, C: 0, Q: 2 }, rationale: 'Mostly drought-side' },
  { id: '6E', bucket: 6, title: 'Establish continuous monitoring and communication', description: '', impacts: { F: 2, D: 2, R: -1, I: 4, C: 2, Q: 3 }, rationale: 'Balanced — keeps decision quality high into the reveal' }
];

export const RANK_WEIGHTS = [1.0, 0.8, 0.6, 0.4, 0.2]; // 1st, 2nd, 3rd, 4th, 5th
