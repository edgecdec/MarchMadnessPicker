import { Region, Team } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";
import { getWinProbability } from "@/lib/seedStats";

type Mode = "chalk" | "random" | "smart";

function pickWinner(a: Team, b: Team, mode: Mode): Team {
  if (mode === "chalk") return a.seed <= b.seed ? a : b;
  if (mode === "random") return Math.random() < 0.5 ? a : b;
  // smart: use historical probability
  const probA = getWinProbability(a.seed, b.seed);
  return Math.random() < probA ? a : b;
}

export function autofillBracket(regions: Region[], mode: Mode): Record<string, string> {
  const picks: Record<string, string> = {};

  // Fill each region (rounds 0-3)
  for (const region of regions) {
    // Round 0: R64
    for (let i = 0; i < 8; i++) {
      const [seedA, seedB] = SEED_ORDER_PAIRS[i];
      const teamA = region.teams.find((t) => t.seed === seedA)!;
      const teamB = region.teams.find((t) => t.seed === seedB)!;
      picks[`${region.name}-0-${i}`] = pickWinner(teamA, teamB, mode).name;
    }
    // Rounds 1-3
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        const nameA = picks[`${region.name}-${round - 1}-${i * 2}`];
        const nameB = picks[`${region.name}-${round - 1}-${i * 2 + 1}`];
        const teamA = region.teams.find((t) => t.name === nameA)!;
        const teamB = region.teams.find((t) => t.name === nameB)!;
        picks[`${region.name}-${round}-${i}`] = pickWinner(teamA, teamB, mode).name;
      }
    }
  }

  // Final Four
  const allTeams = regions.flatMap((r) => r.teams);
  const find = (name: string) => allTeams.find((t) => t.name === name)!;

  // ff-4-0: East(0) winner vs West(1) winner
  const e8_0a = find(picks[`${regions[0].name}-3-0`]);
  const e8_0b = find(picks[`${regions[1].name}-3-0`]);
  picks["ff-4-0"] = pickWinner(e8_0a, e8_0b, mode).name;

  // ff-4-1: South(2) winner vs Midwest(3) winner
  const e8_1a = find(picks[`${regions[2].name}-3-0`]);
  const e8_1b = find(picks[`${regions[3].name}-3-0`]);
  picks["ff-4-1"] = pickWinner(e8_1a, e8_1b, mode).name;

  // Championship
  const chA = find(picks["ff-4-0"]);
  const chB = find(picks["ff-4-1"]);
  picks["ff-5-0"] = pickWinner(chA, chB, mode).name;

  return picks;
}
