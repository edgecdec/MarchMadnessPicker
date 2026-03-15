import { Region, Team, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";
import { getWinProbability } from "@/lib/seedStats";
import { ffGameId } from "@/components/bracket/FirstFour";

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

  // Fill First Four play-in games
  if (firstFour) {
    for (const ff of firstFour) {
      const gid = ffGameId(ff);
      if (picks[gid]) continue;
      const a: Team = { seed: ff.seed, name: ff.teamA };
      const b: Team = { seed: ff.seed, name: ff.teamB };
      picks[gid] = (mode === "random" ? (Math.random() < 0.5 ? a : b) : a).name;
    }
  }

  // Fill each region (rounds 0-3)
  for (const region of regions) {
    // Round 0: R64
    for (let i = 0; i < 8; i++) {
      if (picks[`${region.name}-0-${i}`]) continue;
      const [seedA, seedB] = SEED_ORDER_PAIRS[i];
      const teamA = region.teams.find((t) => t.seed === seedA)!;
      const teamB = region.teams.find((t) => t.seed === seedB)!;
      picks[`${region.name}-0-${i}`] = pickWinner(teamA, teamB, mode).name;
    }
    // Rounds 1-3
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        if (picks[`${region.name}-${round}-${i}`]) continue;
        const nameA = picks[`${region.name}-${round - 1}-${i * 2}`];
        const nameB = picks[`${region.name}-${round - 1}-${i * 2 + 1}`];
        if (!nameA || !nameB) continue;
        const teamA = region.teams.find((t) => t.name === nameA)!;
        const teamB = region.teams.find((t) => t.name === nameB)!;
        if (!teamA || !teamB) continue;
        picks[`${region.name}-${round}-${i}`] = pickWinner(teamA, teamB, mode).name;
      }
    }
  }

  // Final Four
  const allTeams = regions.flatMap((r) => r.teams);
  const find = (name: string) => allTeams.find((t) => t.name === name);

  // ff-4-0: East(0) winner vs West(1) winner
  if (!picks["ff-4-0"]) {
    const a = picks[`${regions[0].name}-3-0`] && find(picks[`${regions[0].name}-3-0`]);
    const b = picks[`${regions[1].name}-3-0`] && find(picks[`${regions[1].name}-3-0`]);
    if (a && b) picks["ff-4-0"] = pickWinner(a, b, mode).name;
  }

  // ff-4-1: South(2) winner vs Midwest(3) winner
  if (!picks["ff-4-1"]) {
    const a = picks[`${regions[2].name}-3-0`] && find(picks[`${regions[2].name}-3-0`]);
    const b = picks[`${regions[3].name}-3-0`] && find(picks[`${regions[3].name}-3-0`]);
    if (a && b) picks["ff-4-1"] = pickWinner(a, b, mode).name;
  }

  // Championship
  if (!picks["ff-5-0"]) {
    const a = picks["ff-4-0"] && find(picks["ff-4-0"]);
    const b = picks["ff-4-1"] && find(picks["ff-4-1"]);
    if (a && b) picks["ff-5-0"] = pickWinner(a, b, mode).name;
  }

  return picks;
}
