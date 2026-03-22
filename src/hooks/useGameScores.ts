"use client";
import { useMemo } from "react";
import { Region, FirstFourGame, GameScore, LiveGame } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";
import { useLiveScores } from "./useLiveScores";

function buildGameTeamPairs(
  regions: Region[],
  firstFour: FirstFourGame[] | undefined,
  results: Record<string, string>,
): Map<string, [string, string]> {
  const map = new Map<string, [string, string]>();
  const rsToName: Record<string, string> = {};
  for (const r of regions) for (const t of r.teams) rsToName[`${r.name}-${t.seed}`] = t.name;
  const resolve = (v: string) => rsToName[v] || v;

  if (firstFour) {
    for (const ff of firstFour)
      map.set(`ff-play-${ff.region}-${ff.seed}-${ff.slot}`, [ff.teamA, ff.teamB]);
  }

  for (const region of regions) {
    for (let i = 0; i < 8; i++) {
      const pair = SEED_ORDER_PAIRS[i];
      let tA = region.teams.find(t => t.seed === pair[0])?.name;
      let tB = region.teams.find(t => t.seed === pair[1])?.name;
      if (firstFour) {
        for (const ff of firstFour) {
          if (ff.region !== region.name) continue;
          const w = results[`ff-play-${ff.region}-${ff.seed}-${ff.slot}`];
          if (w && ff.seed === pair[0]) tA = w;
          else if (w && ff.seed === pair[1]) tB = w;
        }
      }
      if (tA && tB) map.set(`${region.name}-0-${i}`, [tA, tB]);
    }
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        const a = results[`${region.name}-${round - 1}-${i * 2}`];
        const b = results[`${region.name}-${round - 1}-${i * 2 + 1}`];
        if (a && b) map.set(`${region.name}-${round}-${i}`, [resolve(a), resolve(b)]);
      }
    }
  }

  if (regions.length >= 4) {
    const a0 = results[`${regions[0].name}-3-0`], b0 = results[`${regions[2].name}-3-0`];
    if (a0 && b0) map.set("ff-4-0", [resolve(a0), resolve(b0)]);
    const a1 = results[`${regions[1].name}-3-0`], b1 = results[`${regions[3].name}-3-0`];
    if (a1 && b1) map.set("ff-4-1", [resolve(a1), resolve(b1)]);
    const ca = results["ff-4-0"], cb = results["ff-4-1"];
    if (ca && cb) map.set("ff-5-0", [resolve(ca), resolve(cb)]);
  }

  return map;
}

// Build map from ESPN team ID → team name using bracket data
function buildEspnIdToName(regions: Region[], firstFour?: FirstFourGame[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const r of regions) for (const t of r.teams) if (t.espnId != null) map.set(String(t.espnId), t.name);
  if (firstFour) {
    for (const ff of firstFour) {
      if (ff.espnIdA != null) map.set(String(ff.espnIdA), ff.teamA);
      if (ff.espnIdB != null) map.set(String(ff.espnIdB), ff.teamB);
    }
  }
  return map;
}

function matchName(espnName: string, bracketName: string): boolean {
  const a = espnName.toLowerCase().replace(/\./g, "");
  const b = bracketName.toLowerCase().replace(/\./g, "");
  return a === b || a.includes(b) || b.includes(a);
}

export function useGameScores(
  regions: Region[] | null | undefined,
  firstFour: FirstFourGame[] | null | undefined,
  results: Record<string, string>,
): Record<string, GameScore> {
  const liveGames = useLiveScores();

  return useMemo(() => {
    if (!regions || liveGames.length === 0) return {};
    const pairs = buildGameTeamPairs(regions, firstFour || undefined, results);
    const espnIdToName = buildEspnIdToName(regions, firstFour || undefined);
    const scores: Record<string, GameScore> = {};

    for (const game of liveGames) {
      if (game.state === "pre") continue;

      // Resolve ESPN team IDs to our bracket team names
      const homeName = (game.home.id && espnIdToName.get(game.home.id)) || null;
      const awayName = (game.away.id && espnIdToName.get(game.away.id)) || null;

      for (const [gid, [tA, tB]] of pairs) {
        let homeMatchA: boolean, homeMatchB: boolean;

        if (homeName && awayName) {
          // Match by ESPN ID (reliable)
          homeMatchA = homeName === tA && awayName === tB;
          homeMatchB = homeName === tB && awayName === tA;
        } else {
          // Fallback to name matching
          const homeMatchesA = matchName(game.home.name, tA);
          const homeMatchesB = matchName(game.home.name, tB);
          const awayMatchesA = matchName(game.away.name, tA);
          const awayMatchesB = matchName(game.away.name, tB);
          homeMatchA = homeMatchesA && awayMatchesB;
          homeMatchB = homeMatchesB && awayMatchesA;
        }

        if (homeMatchA || homeMatchB) {
          const aIsHome = homeMatchA;
          scores[gid] = {
            teamA: aIsHome ? game.home.score : game.away.score,
            teamB: aIsHome ? game.away.score : game.home.score,
            state: game.state as GameScore["state"],
            detail: game.state === "in" ? game.detail : game.state === "post" ? "Final" : undefined,
          };
          break;
        }
      }
    }
    return scores;
  }, [regions, firstFour, results, liveGames]);
}
