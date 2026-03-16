import { Region, Team, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, ffGameId, toRegionSeed } from "@/lib/bracketData";
import { getWinProbability } from "@/lib/seedStats";

type Mode = "chalk" | "random" | "smart";

function pickWinner(a: Team, b: Team, mode: Mode): Team {
  if (mode === "chalk") return a.seed <= b.seed ? a : b;
  if (mode === "random") return Math.random() < 0.5 ? a : b;
  // smart: use historical probability
  const probA = getWinProbability(a.seed, b.seed);
  return Math.random() < probA ? a : b;
}

export function autofillBracket(regions: Region[], mode: Mode, firstFour?: FirstFourGame[], existingPicks?: Record<string, string>): Record<string, string> {
  const picks: Record<string, string> = existingPicks ? { ...existingPicks } : {};

  // Fill First Four play-in games (stored as team names since both share same region-seed)
  if (firstFour) {
    for (const ff of firstFour) {
      const gid = ffGameId(ff);
      if (picks[gid]) continue;
      const a: Team = { seed: ff.seed, name: ff.teamA };
      const b: Team = { seed: ff.seed, name: ff.teamB };
      picks[gid] = (mode === "random" ? (Math.random() < 0.5 ? a : b) : a).name;
    }
  }

  // Fill each region (rounds 0-3) — picks stored as region-seed identifiers
  for (const region of regions) {
    // Round 0: R64
    for (let i = 0; i < 8; i++) {
      if (picks[`${region.name}-0-${i}`]) continue;
      const [seedA, seedB] = SEED_ORDER_PAIRS[i];
      const teamA: Team = { seed: seedA, name: region.teams.find(t => t.seed === seedA)?.name || `${region.name}-${seedA}` };
      const teamB: Team = { seed: seedB, name: region.teams.find(t => t.seed === seedB)?.name || `${region.name}-${seedB}` };
      const winner = pickWinner(teamA, teamB, mode);
      picks[`${region.name}-0-${i}`] = toRegionSeed(region.name, winner.seed);
    }
    // Rounds 1-3
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        if (picks[`${region.name}-${round}-${i}`]) continue;
        const rsA = picks[`${region.name}-${round - 1}-${i * 2}`];
        const rsB = picks[`${region.name}-${round - 1}-${i * 2 + 1}`];
        if (!rsA || !rsB) continue;
        // Extract seed from region-seed identifier
        const seedA = parseInt(rsA.split("-").pop()!) || 0;
        const seedB = parseInt(rsB.split("-").pop()!) || 0;
        const teamA: Team = { seed: seedA, name: rsA };
        const teamB: Team = { seed: seedB, name: rsB };
        const winner = pickWinner(teamA, teamB, mode);
        picks[`${region.name}-${round}-${i}`] = winner.name; // already a region-seed string
      }
    }
  }

  // Final Four — picks are region-seed identifiers
  const rsFromPick = (pick: string): { seed: number; rs: string } | null => {
    if (!pick) return null;
    const seed = parseInt(pick.split("-").pop()!);
    return isNaN(seed) ? null : { seed, rs: pick };
  };

  // ff-4-0: East(0) winner vs South(2) winner
  if (!picks["ff-4-0"]) {
    const a = rsFromPick(picks[`${regions[0].name}-3-0`]);
    const b = rsFromPick(picks[`${regions[2].name}-3-0`]);
    if (a && b) {
      const winner = pickWinner({ seed: a.seed, name: a.rs }, { seed: b.seed, name: b.rs }, mode);
      picks["ff-4-0"] = winner.name;
    }
  }

  // ff-4-1: West(1) winner vs Midwest(3) winner
  if (!picks["ff-4-1"]) {
    const a = rsFromPick(picks[`${regions[1].name}-3-0`]);
    const b = rsFromPick(picks[`${regions[3].name}-3-0`]);
    if (a && b) {
      const winner = pickWinner({ seed: a.seed, name: a.rs }, { seed: b.seed, name: b.rs }, mode);
      picks["ff-4-1"] = winner.name;
    }
  }

  // Championship
  if (!picks["ff-5-0"]) {
    const a = rsFromPick(picks["ff-4-0"]);
    const b = rsFromPick(picks["ff-4-1"]);
    if (a && b) {
      const winner = pickWinner({ seed: a.seed, name: a.rs }, { seed: b.seed, name: b.rs }, mode);
      picks["ff-5-0"] = winner.name;
    }
  }

  return picks;
}
