import { ScoringSettings, DEFAULT_SCORING, Region } from "@/types";

const DEFAULT_POINTS = [1, 2, 4, 8, 16, 32];

export function scorePicks(
  picks: Record<string, string>,
  results: Record<string, string>,
  settings?: ScoringSettings,
  regions?: Region[],
): number {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  const bonus = settings?.upsetBonusPerRound ?? [0, 0, 0, 0, 0, 0];

  // Build seed lookup from regions
  const seedMap: Record<string, number> = {};
  if (regions) {
    for (const r of regions) {
      for (const t of r.teams) {
        seedMap[t.name] = t.seed;
      }
    }
  }

  let score = 0;
  for (const [gameId, winner] of Object.entries(results)) {
    if (picks[gameId] !== winner) continue;

    const round = parseInt(gameId.split("-")[1]) || 0;
    score += pts[round] || 0;

    // Upset bonus: if winner has a higher seed number (worse seed) than loser
    if (bonus[round] > 0 && Object.keys(seedMap).length > 0) {
      const loser = getLoser(gameId, winner, picks, results, regions);
      if (loser && seedMap[winner] && seedMap[loser]) {
        const diff = seedMap[winner] - seedMap[loser];
        if (diff > 0) {
          score += bonus[round] * diff;
        }
      }
    }
  }
  return score;
}

// Figure out who lost a game given the winner
function getLoser(
  gameId: string,
  winner: string,
  picks: Record<string, string>,
  results: Record<string, string>,
  regions?: Region[],
): string | null {
  // For R64 games, we can derive both teams from the bracket structure
  // For later rounds, the two teams are the winners of the two feeder games
  const parts = gameId.split("-");
  const regionName = parts[0];
  const round = parseInt(parts[1]);
  const idx = parseInt(parts[2]);

  if (round === 0 && regions) {
    // R64: teams come from the bracket seeding
    const SEED_ORDER_PAIRS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];
    const region = regions.find((r) => r.name === regionName);
    if (region) {
      const pair = SEED_ORDER_PAIRS[idx];
      const teamA = region.teams.find((t) => t.seed === pair[0]);
      const teamB = region.teams.find((t) => t.seed === pair[1]);
      if (teamA?.name === winner) return teamB?.name || null;
      if (teamB?.name === winner) return teamA?.name || null;
    }
  } else {
    // Later rounds: both teams are winners of previous round games
    let feederA: string, feederB: string;
    if (regionName === "ff") {
      if (round === 5) { feederA = "ff-4-0"; feederB = "ff-4-1"; }
      else if (round === 4 && idx === 0) {
        // East vs West E8 winners — need region names from bracket
        if (regions) { feederA = `${regions[0].name}-3-0`; feederB = `${regions[1].name}-3-0`; }
        else return null;
      } else if (round === 4 && idx === 1) {
        if (regions) { feederA = `${regions[2].name}-3-0`; feederB = `${regions[3].name}-3-0`; }
        else return null;
      } else return null;
    } else {
      feederA = `${regionName}-${round - 1}-${idx * 2}`;
      feederB = `${regionName}-${round - 1}-${idx * 2 + 1}`;
    }
    const teamA = results[feederA!];
    const teamB = results[feederB!];
    if (teamA === winner) return teamB || null;
    if (teamB === winner) return teamA || null;
  }
  return null;
}

export function maxPossibleScore(results: Record<string, string>, settings?: ScoringSettings): number {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  // Base points only (upset bonus is variable, can't predict max)
  return Object.keys(results).reduce((total, gameId) => {
    const round = parseInt(gameId.split("-")[1]) || 0;
    return total + (pts[round] || 0);
  }, 0);
}

// Max remaining points a player could still earn (picks still alive in undecided games)
export function maxPossibleRemaining(
  picks: Record<string, string>,
  results: Record<string, string>,
  settings?: ScoringSettings,
): number {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  const winners = new Set(Object.values(results));
  let remaining = 0;
  for (const [gameId, pickedTeam] of Object.entries(picks)) {
    if (results[gameId]) continue;
    const round = parseInt(gameId.split("-")[1]) || 0;
    // R64 teams are always still alive if game undecided; later rounds require a prior win
    if (round === 0 || winners.has(pickedTeam)) {
      remaining += pts[round] || 0;
    }
  }
  return remaining;
}

export function getRoundName(round: number): string {
  return ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"][round] || "";
}

// Build set of eliminated team names from results
export function getEliminatedTeams(
  results: Record<string, string>,
  regions?: Region[],
): Set<string> {
  const eliminated = new Set<string>();
  for (const [gameId, winner] of Object.entries(results)) {
    const loser = getLoser(gameId, winner, {}, results, regions);
    if (loser) eliminated.add(loser);
  }
  return eliminated;
}

export { DEFAULT_POINTS as POINTS_PER_ROUND };
