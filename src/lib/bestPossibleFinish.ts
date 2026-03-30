import { Region, ScoringSettings } from "@/types";
import { scorePicks } from "./scoring";

const MATCHUPS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];

interface GameInfo { id: string; round: number; region: string; idx: number }

function allGames(regions: Region[]): GameInfo[] {
  const g: GameInfo[] = [];
  for (const r of regions) {
    for (let i = 0; i < 8; i++) g.push({ id: `${r.name}-0-${i}`, round: 0, region: r.name, idx: i });
    for (let i = 0; i < 4; i++) g.push({ id: `${r.name}-1-${i}`, round: 1, region: r.name, idx: i });
    for (let i = 0; i < 2; i++) g.push({ id: `${r.name}-2-${i}`, round: 2, region: r.name, idx: i });
    g.push({ id: `${r.name}-3-0`, round: 3, region: r.name, idx: 0 });
  }
  g.push({ id: "ff-4-0", round: 4, region: "ff", idx: 0 });
  g.push({ id: "ff-4-1", round: 4, region: "ff", idx: 1 });
  g.push({ id: "ff-5-0", round: 5, region: "ff", idx: 0 });
  return g;
}

function getTeams(g: GameInfo, res: Record<string, string>, regions: Region[]): [string, string] | null {
  if (g.round === 0) {
    const [sA, sB] = MATCHUPS[g.idx];
    return [`${g.region}-${sA}`, `${g.region}-${sB}`];
  }
  let fA: string, fB: string;
  if (g.region === "ff") {
    if (g.round === 5) { fA = "ff-4-0"; fB = "ff-4-1"; }
    else if (g.idx === 0) { fA = `${regions[0].name}-3-0`; fB = `${regions[2].name}-3-0`; }
    else { fA = `${regions[1].name}-3-0`; fB = `${regions[3].name}-3-0`; }
  } else {
    fA = `${g.region}-${g.round - 1}-${g.idx * 2}`;
    fB = `${g.region}-${g.round - 1}-${g.idx * 2 + 1}`;
  }
  const tA = res[fA], tB = res[fB];
  return (tA && tB) ? [tA, tB] : null;
}

/**
 * Compute best possible finish for all brackets by enumerating all tournament
 * outcomes and scoring every bracket for each. Only call when ≤15 games remain.
 * Runs in async chunks to avoid blocking UI.
 */
export function computeBestPossibleFinishAsync(
  entries: { username: string; bracket_name?: string; picks: Record<string, string>; tiebreaker?: number | null }[],
  results: Record<string, string>,
  regions: Region[],
  settings: ScoringSettings,
  onProgress?: (bestRank: Record<string, number>) => void,
): { promise: Promise<Record<string, number>>; cancel: () => void } {
  let cancelled = false;
  const cancel = () => { cancelled = true; };

  const promise = new Promise<Record<string, number>>((resolve) => {
    const games = allGames(regions);
    const undecided = games.filter(g => !results[g.id]);
    const totalOutcomes = 1 << undecided.length;
    const keys = entries.map(e => `${e.username}|${e.bracket_name || ""}`);
    const bestRank: Record<string, number> = {};
    for (const k of keys) bestRank[k] = entries.length;

    let mask = 0;
    const CHUNK = 256;

    function processChunk() {
      if (cancelled) { resolve(bestRank); return; }
      const end = Math.min(mask + CHUNK, totalOutcomes);

      for (; mask < end; mask++) {
        const simResults = { ...results };
        let valid = true;

        for (let i = 0; i < undecided.length; i++) {
          const g = undecided[i];
          const teams = getTeams(g, simResults, regions);
          if (!teams) { valid = false; break; }
          simResults[g.id] = ((mask >> i) & 1) === 0 ? teams[0] : teams[1];
        }
        if (!valid) continue;

        const scores = entries.map(e => scorePicks(e.picks, simResults, settings, regions));
        for (let i = 0; i < entries.length; i++) {
          const rank = scores.filter(s => s > scores[i]).length + 1;
          if (rank < bestRank[keys[i]]) bestRank[keys[i]] = rank;
        }
      }

      if (mask >= totalOutcomes) {
        onProgress?.({ ...bestRank });
        resolve(bestRank);
      } else {
        onProgress?.({ ...bestRank });
        setTimeout(processChunk, 0);
      }
    }

    setTimeout(processChunk, 0);
  });

  return { promise, cancel };
}
