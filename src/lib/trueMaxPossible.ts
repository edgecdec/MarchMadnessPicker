import { Region, ScoringSettings } from "@/types";

const MATCHUPS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]];

function scoreGame(
  picks: Record<string, string>,
  gameId: string,
  winner: string,
  loser: string,
  round: number,
  pts: number[],
  bonus: number[],
  seedOf: Record<string, number>,
): number {
  const pick = picks[gameId];
  if (pick !== winner) return 0;
  let s = pts[round] || 0;
  if (bonus[round] > 0) {
    const ws = seedOf[winner], ls = seedOf[loser];
    if (ws && ls && ws > ls) s += bonus[round] * (ws - ls);
  }
  return s;
}

/**
 * Compute the true maximum possible score for a bracket, including upset bonuses.
 * Brute-forces all possible tournament outcomes per region (~32K each),
 * then combines with Final Four/Championship possibilities.
 * Fixed results are honored — only undecided games are enumerated.
 */
export function computeTrueMax(
  picks: Record<string, string>,
  results: Record<string, string>,
  regions: Region[],
  settings: ScoringSettings,
): number {
  const pts = settings.pointsPerRound;
  const bonus = settings.upsetBonusPerRound;
  const seedOf: Record<string, number> = {};
  for (const r of regions) for (const t of r.teams) seedOf[`${r.name}-${t.seed}`] = t.seed;

  // Score already-decided games (fixed score component)
  let fixedScore = 0;
  for (const [gameId, winner] of Object.entries(results)) {
    if (!/^(East|West|South|Midwest)-[0-3]-\d+$|^ff-[45]-[01]$/.test(gameId)) continue;
    const round = parseInt(gameId.split("-")[1]);
    // Find loser from the game
    const loser = findLoser(gameId, winner, results, regions);
    if (loser) {
      const pick = picks[gameId];
      if (pick === winner) {
        fixedScore += pts[round] || 0;
        if (bonus[round] > 0) {
          const ws = seedOf[winner], ls = seedOf[loser];
          if (ws && ls && ws > ls) fixedScore += bonus[round] * (ws - ls);
        }
      }
    }
  }

  // Per-region: enumerate all possible outcomes for undecided games,
  // tracking best score per E8 winner
  const regionBestByWinner: Record<string, Record<string, number>> = {};

  for (const region of regions) {
    const name = region.name;
    regionBestByWinner[name] = {};

    for (let r64mask = 0; r64mask < 256; r64mask++) {
      const r64winners: string[] = [];
      let r64score = 0;
      let skip = false;

      for (let i = 0; i < 8; i++) {
        const gid = `${name}-0-${i}`;
        const [seedA, seedB] = MATCHUPS[i];
        const teamA = `${name}-${seedA}`;
        const teamB = `${name}-${seedB}`;
        const bit = (r64mask >> i) & 1;
        const winner = bit === 0 ? teamA : teamB;

        // If this game is already decided, outcome must match
        if (results[gid]) {
          if (results[gid] !== winner) { skip = true; break; }
          r64winners.push(winner);
          continue; // score already counted in fixedScore
        }
        const loser = bit === 0 ? teamB : teamA;
        r64winners.push(winner);
        r64score += scoreGame(picks, gid, winner, loser, 0, pts, bonus, seedOf);
      }
      if (skip) continue;

      for (let r32mask = 0; r32mask < 16; r32mask++) {
        const r32winners: string[] = [];
        let r32score = r64score;
        let skip2 = false;

        for (let i = 0; i < 4; i++) {
          const gid = `${name}-1-${i}`;
          const teamA = r64winners[i * 2];
          const teamB = r64winners[i * 2 + 1];
          const bit = (r32mask >> i) & 1;
          const winner = bit === 0 ? teamA : teamB;

          if (results[gid]) {
            if (results[gid] !== winner) { skip2 = true; break; }
            r32winners.push(winner);
            continue;
          }
          const loser = bit === 0 ? teamB : teamA;
          r32winners.push(winner);
          r32score += scoreGame(picks, gid, winner, loser, 1, pts, bonus, seedOf);
        }
        if (skip2) continue;

        for (let s16mask = 0; s16mask < 4; s16mask++) {
          const s16winners: string[] = [];
          let s16score = r32score;
          let skip3 = false;

          for (let i = 0; i < 2; i++) {
            const gid = `${name}-2-${i}`;
            const teamA = r32winners[i * 2];
            const teamB = r32winners[i * 2 + 1];
            const bit = (s16mask >> i) & 1;
            const winner = bit === 0 ? teamA : teamB;

            if (results[gid]) {
              if (results[gid] !== winner) { skip3 = true; break; }
              s16winners.push(winner);
              continue;
            }
            const loser = bit === 0 ? teamB : teamA;
            s16winners.push(winner);
            s16score += scoreGame(picks, gid, winner, loser, 2, pts, bonus, seedOf);
          }
          if (skip3) continue;

          for (let e8bit = 0; e8bit < 2; e8bit++) {
            const gid = `${name}-3-0`;
            const teamA = s16winners[0];
            const teamB = s16winners[1];
            const winner = e8bit === 0 ? teamA : teamB;

            if (results[gid]) {
              if (results[gid] !== winner) continue;
              // Score already counted; just record the E8 winner
              const prev = regionBestByWinner[name][winner] ?? 0;
              const total = s16score;
              if (total > prev) regionBestByWinner[name][winner] = total;
              continue;
            }
            const loser = e8bit === 0 ? teamB : teamA;
            const total = s16score + scoreGame(picks, gid, winner, loser, 3, pts, bonus, seedOf);
            const prev = regionBestByWinner[name][winner] ?? 0;
            if (total > prev) regionBestByWinner[name][winner] = total;
          }
        }
      }
    }

    // If no outcomes found (all games decided), ensure we have an entry
    if (Object.keys(regionBestByWinner[name]).length === 0) {
      const e8winner = results[`${name}-3-0`];
      if (e8winner) regionBestByWinner[name][e8winner] = 0;
    }
  }

  // Final Four + Championship: try all E8 winner combinations
  const rNames = regions.map(r => r.name);
  // FF game 0: regions[0] vs regions[2], FF game 1: regions[1] vs regions[3]
  const leftA = rNames[0], leftB = rNames[2];
  const rightA = rNames[1], rightB = rNames[3];

  let bestFF = 0;

  for (const la of Object.keys(regionBestByWinner[leftA])) {
    for (const lb of Object.keys(regionBestByWinner[leftB])) {
      for (let ff0bit = 0; ff0bit < 2; ff0bit++) {
        const ff0w = ff0bit === 0 ? la : lb;
        const ff0l = ff0bit === 0 ? lb : la;
        if (results["ff-4-0"] && results["ff-4-0"] !== ff0w) continue;
        const ff0s = results["ff-4-0"] ? 0 : scoreGame(picks, "ff-4-0", ff0w, ff0l, 4, pts, bonus, seedOf);

        for (const ra of Object.keys(regionBestByWinner[rightA])) {
          for (const rb of Object.keys(regionBestByWinner[rightB])) {
            for (let ff1bit = 0; ff1bit < 2; ff1bit++) {
              const ff1w = ff1bit === 0 ? ra : rb;
              const ff1l = ff1bit === 0 ? rb : ra;
              if (results["ff-4-1"] && results["ff-4-1"] !== ff1w) continue;
              const ff1s = results["ff-4-1"] ? 0 : scoreGame(picks, "ff-4-1", ff1w, ff1l, 4, pts, bonus, seedOf);

              for (let cBit = 0; cBit < 2; cBit++) {
                const cw = cBit === 0 ? ff0w : ff1w;
                const cl = cBit === 0 ? ff1w : ff0w;
                if (results["ff-5-0"] && results["ff-5-0"] !== cw) continue;
                const cs = results["ff-5-0"] ? 0 : scoreGame(picks, "ff-5-0", cw, cl, 5, pts, bonus, seedOf);

                const total = regionBestByWinner[leftA][la]
                  + regionBestByWinner[leftB][lb]
                  + regionBestByWinner[rightA][ra]
                  + regionBestByWinner[rightB][rb]
                  + ff0s + ff1s + cs;

                if (total > bestFF) bestFF = total;
              }
            }
          }
        }
      }
    }
  }

  return fixedScore + bestFF;
}

function findLoser(
  gameId: string,
  winner: string,
  results: Record<string, string>,
  regions: Region[],
): string | null {
  const parts = gameId.split("-");
  const regionName = parts[0];
  const round = parseInt(parts[1]);
  const idx = parseInt(parts[2]);

  if (round === 0) {
    const region = regions.find(r => r.name === regionName);
    if (!region) return null;
    const [seedA, seedB] = MATCHUPS[idx];
    const a = `${regionName}-${seedA}`, b = `${regionName}-${seedB}`;
    return winner === a ? b : winner === b ? a : null;
  }

  let feederA: string, feederB: string;
  if (regionName === "ff") {
    if (round === 5) { feederA = "ff-4-0"; feederB = "ff-4-1"; }
    else if (round === 4 && idx === 0) { feederA = `${regions[0].name}-3-0`; feederB = `${regions[2].name}-3-0`; }
    else if (round === 4 && idx === 1) { feederA = `${regions[1].name}-3-0`; feederB = `${regions[3].name}-3-0`; }
    else return null;
  } else {
    feederA = `${regionName}-${round - 1}-${idx * 2}`;
    feederB = `${regionName}-${round - 1}-${idx * 2 + 1}`;
  }
  const a = results[feederA!], b = results[feederB!];
  if (a === winner) return b || null;
  if (b === winner) return a || null;
  return null;
}
