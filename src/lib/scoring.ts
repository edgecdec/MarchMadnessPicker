// Shared scoring logic — used by both client components and server API

const POINTS_PER_ROUND = [1, 2, 4, 8, 16, 32];

export function scorePicks(picks: Record<string, string>, results: Record<string, string>): number {
  let score = 0;
  for (const [gameId, winner] of Object.entries(results)) {
    if (picks[gameId] === winner) {
      const round = parseInt(gameId.split("-")[1]) || 0;
      score += POINTS_PER_ROUND[round] || 0;
    }
  }
  return score;
}

export function maxPossibleScore(results: Record<string, string>): number {
  return Object.keys(results).reduce((total, gameId) => {
    const round = parseInt(gameId.split("-")[1]) || 0;
    return total + (POINTS_PER_ROUND[round] || 0);
  }, 0);
}

export function getRoundName(round: number): string {
  return ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"][round] || "";
}

export { POINTS_PER_ROUND };
