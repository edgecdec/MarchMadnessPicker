// Historical NCAA tournament seed vs seed win rates (higher seed win %)
// Source: aggregated from 1985–2024 tournament results
// Key format: "higherSeed-lowerSeed" → win rate for the HIGHER (lower number) seed

export const SEED_WIN_RATES: Record<string, number> = {
  "1-16": 0.99,
  "8-9": 0.51,
  "5-12": 0.64,
  "4-13": 0.79,
  "6-11": 0.63,
  "3-14": 0.85,
  "7-10": 0.61,
  "2-15": 0.94,
};

// For later rounds, use generic seed-vs-seed rates
// Returns probability that teamA (with seedA) beats teamB (with seedB)
export function getWinProbability(seedA: number, seedB: number): number {
  if (seedA === seedB) return 0.5;
  const higher = Math.min(seedA, seedB);
  const lower = Math.max(seedA, seedB);
  const key = `${higher}-${lower}`;
  if (SEED_WIN_RATES[key] !== undefined) {
    return seedA === higher ? SEED_WIN_RATES[key] : 1 - SEED_WIN_RATES[key];
  }
  // Fallback: logistic estimate based on seed difference
  const diff = seedB - seedA; // positive means A is better seed
  const prob = 1 / (1 + Math.exp(-0.15 * diff));
  return prob;
}
