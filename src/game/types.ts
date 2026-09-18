export type HiddenVariables = {
  F: number; // Flood Preparedness
  D: number; // Drought Preparedness
  R: number; // Resource / Budget remaining
  I: number; // Information Quality
  C: number; // Community Trust
  Q: number; // Decision Quality
};

export type ActionId = string;

export interface Action {
  id: ActionId;
  bucket: number;
  title: string;
  description: string;
  impacts: HiddenVariables;
  rationale: string;
}

export interface BucketDecision {
  bucket: number;
  rankings: ActionId[]; // Array from 1st to 5th priority
}

export interface GameState {
  currentDay: number;
  currentBucket: number;
  
  // Accumulated Hidden Variables (Raw Scores)
  variables: HiddenVariables;
  
  // Visible Player Context
  budget: number;
  waterStorage: number; // m3
  waterCapacity: number; // m3
  
  // Game sequence log
  decisions: BucketDecision[];
}

export type PreparednessRating = 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'Critical';
export type ScenarioOutcome = 'Flood' | 'Drought';

export interface FinalResult {
  cps: number; // Composite Preparedness Score
  pathway: ScenarioOutcome;
  rating: PreparednessRating;
}
