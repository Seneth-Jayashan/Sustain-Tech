import { SCENARIOS } from './scenario';

/**
 * Authoritative round deadline durations in seconds (20-Minute Tournament Configuration):
 * - Day 0 (Bucket 1): 180 seconds (03:00) — Early Warning
 * - Day 2 (Bucket 2): 180 seconds (03:00) — Compound Hazard
 * - Day 4 (Bucket 3): 240 seconds (04:00) — Fiscal Allocation (extended allocation window)
 * - Day 6 (Bucket 4): 240 seconds (04:00) — Emergency Fleet Distribution (extended allocation window)
 * - Day 8 (Bucket 5): 180 seconds (03:00) — Crisis Escalation
 * - Day 10 (Bucket 6): 180 seconds (03:00) — Recovery Operations
 * Total planned decision-time allowance: 1200 seconds (20:00).
 */
export const ROUND_DEADLINE_SECONDS: Record<number, number> = {
  1: 180, // Day 0 — Early Warning
  2: 180, // Day 2 — Compound Hazard
  3: 240, // Day 4 — Fiscal Allocation
  4: 240, // Day 6 — Emergency Fleet Distribution
  5: 180, // Day 8 — Crisis Escalation
  6: 180, // Day 10 — Recovery Operations
};

export const TOTAL_PLANNED_ALLOWANCE_SECONDS = Object.values(ROUND_DEADLINE_SECONDS).reduce((a, b) => a + b, 0); // 1200 (20 minutes)

/**
 * Returns the authoritative allocated duration for a given round bucket in seconds.
 */
export function getRoundDuration(bucket: number): number {
  return ROUND_DEADLINE_SECONDS[bucket] || 120;
}

/**
 * Deterministic pseudo-random number generator (Mulberry32) for reproducible seeded shuffling.
 */
export function createSeededRng(seedStr: string): () => number {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function next(): number {
    h |= 0;
    h = h + 0x6D2B79F5 | 0;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a reproducible, shuffled order of action IDs for a given session seed and round bucket.
 * Keeps action IDs, costs, impacts, and consequences 100% unchanged; only permutes display position.
 */
export function getShuffledActionIds(
  actionsOrBucket: Array<{ id: string }> | Array<string> | number,
  seed: string,
  bucket?: number
): string[] {
  let ids: string[] = [];
  let roundBucket = bucket ?? 1;

  if (typeof actionsOrBucket === 'number') {
    roundBucket = actionsOrBucket;
    const scenario = SCENARIOS[roundBucket];
    ids = scenario?.actions ? scenario.actions.map(a => a.id) : [];
  } else if (Array.isArray(actionsOrBucket)) {
    ids = actionsOrBucket.map(a => typeof a === 'string' ? a : a.id);
  }

  const rng = createSeededRng(`${seed}-round-bucket-${roundBucket}`);
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Returns the default shuffled order for bucket if defined in SCENARIOS.
 */
export function getDefaultBucketShuffledOrder(seed: string, bucket: number): string[] {
  const scenario = SCENARIOS[bucket];
  if (!scenario || !scenario.actions) {
    return [];
  }
  return getShuffledActionIds(scenario.actions, seed, bucket);
}
