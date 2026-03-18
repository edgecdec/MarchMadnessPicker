import { ScoringSettings, DEFAULT_SCORING, Region } from "@/types";
import { parseRegionSeed } from "@/lib/bracketData";

const DEFAULT_POINTS = [1, 2, 4, 8, 16, 32];

// First Four play-in games are not pickable — exclude from scoring
function isFirstFour(gameId: string): boolean {
  return gameId.startsWith("ff-play-");
}

// Check if a pick matches a result
// Both should be region-seed identifiers (e.g. "East-1") for bracket games,
// or team names for First Four play-in games.
// Also handles legacy name-based picks for backward compatibility.
function pickMatches(pick: string | undefined, result: string, seedMap?: Record<string, { region: string; seed: number }>): boolean {
  if (!pick) return false;
  if (pick === result) return true;
  // Legacy: combined FF name "TeamA/TeamB" matches either team
  if (pick.includes("/")) return pick.split("/").includes(result);
  return false;
}

export function scorePicks(
  picks: Record<string, string>,
  results: Record<string, string>,
  settings?: ScoringSettings,
  regions?: Region[],
): number {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  const bonus = settings?.upsetBonusPerRound ?? [0, 0, 0, 0, 0, 0];

  // Build seed lookup: region-seed -> seed number, and team name -> seed number
  const seedFromRS: Record<string, number> = {};
  const seedFromName: Record<string, number> = {};
  if (regions) {
    for (const r of regions) {
      for (const t of r.teams) {
        seedFromRS[`${r.name}-${t.seed}`] = t.seed;
        seedFromName[t.name] = t.seed;
      }
    }
  }

  let score = 0;
  for (const [gameId, winner] of Object.entries(results)) {
    if (isFirstFour(gameId)) continue;
    if (!pickMatches(picks[gameId], winner)) continue;

    const round = parseInt(gameId.split("-")[1]) || 0;
    score += pts[round] || 0;

    // Upset bonus
    if (bonus[round] > 0 && regions) {
      const loser = getLoser(gameId, winner, picks, results, regions);
      const winnerSeed = seedFromRS[winner] ?? seedFromName[winner];
      const loserSeed = loser ? (seedFromRS[loser] ?? seedFromName[loser]) : undefined;
      if (winnerSeed && loserSeed) {
        const diff = winnerSeed - loserSeed;
        if (diff > 0) score += bonus[round] * diff;
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
      // Build region-seed identifiers for both teams
      const rsA = `${regionName}-${pair[0]}`;
      const rsB = `${regionName}-${pair[1]}`;
      if (winner === rsA) return rsB;
      if (winner === rsB) return rsA;
      // Fallback: name-based matching
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
        if (regions) { feederA = `${regions[0].name}-3-0`; feederB = `${regions[2].name}-3-0`; }
        else return null;
      } else if (round === 4 && idx === 1) {
        if (regions) { feederA = `${regions[1].name}-3-0`; feederB = `${regions[3].name}-3-0`; }
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

export function scorePicksByRound(
  picks: Record<string, string>,
  results: Record<string, string>,
  settings?: ScoringSettings,
  regions?: Region[],
): number[] {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  const bonus = settings?.upsetBonusPerRound ?? [0, 0, 0, 0, 0, 0];
  const scores = [0, 0, 0, 0, 0, 0];

  const seedFromRS: Record<string, number> = {};
  const seedFromName: Record<string, number> = {};
  if (regions) {
    for (const r of regions) {
      for (const t of r.teams) {
        seedFromRS[`${r.name}-${t.seed}`] = t.seed;
        seedFromName[t.name] = t.seed;
      }
    }
  }

  for (const [gameId, winner] of Object.entries(results)) {
    if (isFirstFour(gameId)) continue;
    if (!pickMatches(picks[gameId], winner)) continue;
    const round = parseInt(gameId.split("-")[1]) || 0;
    if (round >= 0 && round < 6) {
      scores[round] += pts[round] || 0;
      if (bonus[round] > 0 && regions) {
        const loser = getLoser(gameId, winner, picks, results, regions);
        const winnerSeed = seedFromRS[winner] ?? seedFromName[winner];
        const loserSeed = loser ? (seedFromRS[loser] ?? seedFromName[loser]) : undefined;
        if (winnerSeed && loserSeed) {
          const diff = winnerSeed - loserSeed;
          if (diff > 0) scores[round] += bonus[round] * diff;
        }
      }
    }
  }
  return scores;
}

export function maxPossibleScore(results: Record<string, string>, settings?: ScoringSettings): number {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  // Base points only (upset bonus is variable, can't predict max)
  return Object.keys(results).reduce((total, gameId) => {
    if (isFirstFour(gameId)) return total;
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
    const alive = round === 0 || winners.has(pickedTeam);
    if (alive) {
      remaining += pts[round] || 0;
    }
  }
  return remaining;
}

export function getRoundName(round: number): string {
  return ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"][round] || "";
}

// Build set of eliminated team identifiers (region-seed or name) from results
export function getEliminatedTeams(
  results: Record<string, string>,
  regions?: Region[],
): Set<string> {
  const eliminated = new Set<string>();
  for (const [gameId, winner] of Object.entries(results)) {
    const loser = getLoser(gameId, winner, {}, results, regions);
    if (loser) {
      eliminated.add(loser);
      // Also add the team name for display-level checks
      if (regions) {
        const parsed = parseRegionSeed(loser);
        if (parsed) {
          const region = regions.find(r => r.name === parsed.region);
          const team = region?.teams.find(t => t.seed === parsed.seed);
          if (team) eliminated.add(team.name);
        }
      }
    }
  }
  return eliminated;
}

export interface PickDetail {
  gameId: string;
  round: number;
  pick: string;
  result: string | null;
  correct: boolean;
  basePoints: number;
  upsetBonus: number;
}

export function scorePicksDetailed(
  picks: Record<string, string>,
  results: Record<string, string>,
  settings?: ScoringSettings,
  regions?: Region[],
): PickDetail[] {
  const pts = settings?.pointsPerRound ?? DEFAULT_POINTS;
  const bonus = settings?.upsetBonusPerRound ?? [0, 0, 0, 0, 0, 0];
  const seedFromRS: Record<string, number> = {};
  const seedFromName: Record<string, number> = {};
  if (regions) for (const r of regions) for (const t of r.teams) {
    seedFromRS[`${r.name}-${t.seed}`] = t.seed;
    seedFromName[t.name] = t.seed;
  }

  const details: PickDetail[] = [];
  for (const [gameId, pick] of Object.entries(picks)) {
    const round = parseInt(gameId.split("-")[1]) || 0;
    const result = results[gameId] || null;
    const correct = result !== null && pickMatches(pick, result);
    let base = 0, upsetB = 0;
    if (correct) {
      base = pts[round] || 0;
      if (bonus[round] > 0 && regions) {
        const loser = getLoser(gameId, result, picks, results, regions);
        const winnerSeed = seedFromRS[result] ?? seedFromName[result];
        const loserSeed = loser ? (seedFromRS[loser] ?? seedFromName[loser]) : undefined;
        if (winnerSeed && loserSeed) {
          const diff = winnerSeed - loserSeed;
          if (diff > 0) upsetB = bonus[round] * diff;
        }
      }
    }
    details.push({ gameId, round, pick, result, correct, basePoints: base, upsetBonus: upsetB });
  }
  return details.sort((a, b) => a.round - b.round || a.gameId.localeCompare(b.gameId));
}

export { DEFAULT_POINTS as POINTS_PER_ROUND };
