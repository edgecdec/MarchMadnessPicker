import { Region } from "@/types";

/**
 * Build the ordered list of 63 game IDs for step-by-step bracket filling.
 * Order: R64→R32→S16→E8 (grouped by region within each round), then FF→Championship.
 */
export function buildGameOrder(regions: Region[]): string[] {
  const games: string[] = [];
  for (let round = 0; round <= 3; round++) {
    const count = 8 / Math.pow(2, round);
    for (const region of regions) {
      for (let i = 0; i < count; i++) {
        games.push(`${region.name}-${round}-${i}`);
      }
    }
  }
  games.push("ff-4-0", "ff-4-1", "ff-5-0");
  return games;
}

/**
 * Clear all downstream picks that depend on a team that was just un-picked.
 * Shared between Bracket and SimpleMode components.
 */
export function cascadeClear(picks: Record<string, string>, gameId: string, oldWinner: string): Record<string, string> {
  const updated = { ...picks };
  const parts = gameId.split("-");

  const region = parts[0];
  const round = parseInt(parts[1]);

  // Clear in subsequent rounds within the region
  for (let r = round + 1; r <= 3; r++) {
    const gamesInRound = 8 / Math.pow(2, r);
    for (let i = 0; i < gamesInRound; i++) {
      const gid = `${region}-${r}-${i}`;
      if (updated[gid] === oldWinner) delete updated[gid];
    }
  }

  // Clear Final Four and Championship if affected
  // But NOT when changing the championship pick itself (ff-5-0) — nothing is downstream of it,
  // and clearing ff-4-x would remove the opponent from the championship display.
  const ffGids = gameId === "ff-5-0" ? [] : ["ff-4-0", "ff-4-1", "ff-5-0"];
  for (const gid of ffGids) {
    if (updated[gid] === oldWinner) delete updated[gid];
  }

  return updated;
}
