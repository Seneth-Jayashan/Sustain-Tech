import { SCENARIOS } from './scenario';

/**
 * Authoritative round deadline durations in seconds for playtesting.
 * Day 0 (Bucket 1): 2:00 = 120s
 * Day 2 (Bucket 2): 1:40 = 100s
 * Day 4 (Bucket 3): 1:30 = 90s
 * Day 6 (Bucket 4): 1:15 = 75s
 * Day 8 (Bucket 5): 1:00 = 60s
 * Day 10 (Bucket 6): 1:15 = 75s
 */
export const ROUND_DEADLINE_SECONDS: Record<number, number> = {
  1: 120, // Day 0 — Early warning
  2: 100, // Day 2 — Compound hazards
  3: 90,  // Day 4 — Critical resource allocation
  4: 75,  // Day 6 — Emergency fleet deployment
  5: 60,  // Day 8 — Crisis escalation
  6: 75,  // Day 10 — Recovery decisions
};

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
