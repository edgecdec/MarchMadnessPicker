import { getDb } from "@/lib/db";
import { BracketData } from "@/types";
import { SEED_ORDER_PAIRS, toRegionSeed } from "@/lib/bracketData";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

const ESPN_NAME_ALIASES: Record<string, string> = {
  "st john's": "St. Johns",
  "st. john's": "St. Johns",
  "saint mary's": "St. Marys",
  "st. mary's": "St. Marys",
  "mississippi st": "Mississippi St.",
  "michigan st": "Michigan St.",
  "iowa st": "Iowa St.",
  "boise st": "Boise St.",
  "colorado st": "Colorado St.",
  "san diego st": "San Diego St.",
  "oklahoma st": "Oklahoma St.",
  "kansas st": "Kansas St.",
  "ohio st": "Ohio St.",
  "florida st": "Florida St.",
  "penn st": "Penn St.",
  "arizona st": "Arizona St.",
  "oregon st": "Oregon St.",
  "nc state": "NC State",
  "ole miss": "Ole Miss",
  "uc san diego": "UC San Diego",
  "siu edwardsville": "SIU Edwardsville",
  "siue": "SIUE",
  "alabama st": "Alabama St.",
  "texas a&m": "Texas A&M",
  "uconn": "UConn",
  "loyola chicago": "Loyola Chicago",
  "murray st": "Murray St.",
  "hawai'i": "Hawaii",
};

function buildTeamNameMap(bracketData: BracketData): Record<string, string> {
  const allTeams: string[] = [];
  for (const r of bracketData.regions) for (const t of r.teams) allTeams.push(t.name);
  if (bracketData.first_four) for (const ff of bracketData.first_four) allTeams.push(ff.teamA, ff.teamB);
  return Object.fromEntries(allTeams.map(n => [n.toLowerCase(), n]));
}

function matchEspnName(espnName: string, ourTeams: Record<string, string>): string | null {
  const lower = espnName.toLowerCase();
  if (ourTeams[lower]) return ourTeams[lower];
  if (ESPN_NAME_ALIASES[lower]) return ESPN_NAME_ALIASES[lower];
  const noDots = lower.replace(/\./g, "");
  if (ourTeams[noDots]) return ourTeams[noDots];
  for (const key of Object.keys(ourTeams)) {
    if (key.replace(/\./g, "") === noDots) return ourTeams[key];
  }
  // Fallback: strip apostrophes, accents, and special chars then compare
  const stripped = lower.replace(/[''`.\-]/g, "");
  for (const key of Object.keys(ourTeams)) {
    if (key.replace(/[''`.\-]/g, "") === stripped) return ourTeams[key];
  }
  return null;
}

function buildGameTeams(bracketData: BracketData, results: Record<string, string>): Map<string, [string, string]> {
  const map = new Map<string, [string, string]>();
  const regions = bracketData.regions;
  const rsToName: Record<string, string> = {};
  for (const r of regions) for (const t of r.teams) rsToName[`${r.name}-${t.seed}`] = t.name;
  const resolveName = (val: string): string => rsToName[val] || val;

  if (bracketData.first_four) {
    for (const ff of bracketData.first_four) {
      map.set(`ff-play-${ff.region}-${ff.seed}-${ff.slot}`, [ff.teamA, ff.teamB]);
    }
  }

  for (const region of regions) {
    for (let i = 0; i < 8; i++) {
      const gid = `${region.name}-0-${i}`;
      const pair = SEED_ORDER_PAIRS[i];
      let teamA = region.teams.find(t => t.seed === pair[0])?.name;
      let teamB = region.teams.find(t => t.seed === pair[1])?.name;
      if (bracketData.first_four) {
        for (const ff of bracketData.first_four) {
          if (ff.region === region.name && (ff.seed === pair[0] || ff.seed === pair[1])) {
            const ffWinner = results[`ff-play-${ff.region}-${ff.seed}-${ff.slot}`];
            if (ffWinner) {
              if (ff.seed === pair[0]) teamA = ffWinner; else teamB = ffWinner;
            }
          }
        }
      }
      if (teamA && teamB) map.set(gid, [teamA, teamB]);
    }
  }

  for (const region of regions) {
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        const gid = `${region.name}-${round}-${i}`;
        const rawA = results[`${region.name}-${round - 1}-${i * 2}`];
        const rawB = results[`${region.name}-${round - 1}-${i * 2 + 1}`];
        const teamA = rawA ? resolveName(rawA) : undefined;
        const teamB = rawB ? resolveName(rawB) : undefined;
        if (teamA && teamB) map.set(gid, [teamA, teamB]);
      }
    }
  }

  if (regions.length >= 4) {
    const ff0a = results[`${regions[0].name}-3-0`];
    const ff0b = results[`${regions[2].name}-3-0`];
    if (ff0a && ff0b) map.set("ff-4-0", [resolveName(ff0a), resolveName(ff0b)]);
    const ff1a = results[`${regions[1].name}-3-0`];
    const ff1b = results[`${regions[3].name}-3-0`];
    if (ff1a && ff1b) map.set("ff-4-1", [resolveName(ff1a), resolveName(ff1b)]);
  }

  const chA = results["ff-4-0"];
  const chB = results["ff-4-1"];
  if (chA && chB) map.set("ff-5-0", [resolveName(chA), resolveName(chB)]);

  return map;
}

// In-memory lock to prevent concurrent syncs
let syncInProgress = false;

export async function syncEspnResults(daysBack: number = 2): Promise<{ updated: number; matched: string[]; unmatched: string[]; totalResults: number; skipped?: boolean }> {
  if (syncInProgress) return { updated: 0, matched: [], unmatched: [], totalResults: 0, skipped: true };
  syncInProgress = true;

  try {
    const db = getDb();
    const tournament = db.prepare("SELECT * FROM tournaments ORDER BY year DESC LIMIT 1").get() as any;
    if (!tournament) return { updated: 0, matched: [], unmatched: [], totalResults: 0 };

    const bracketData: BracketData = JSON.parse(tournament.bracket_data);
    const results: Record<string, string> = JSON.parse(tournament.results_data || "{}");
    const ourTeams = buildTeamNameMap(bracketData);
    const gameTeams = buildGameTeams(bracketData, results);

    const nameToRS: Record<string, string> = {};
    for (const r of bracketData.regions) for (const t of r.teams) nameToRS[t.name] = toRegionSeed(r.name, t.seed);
    if (bracketData.first_four) {
      for (const ff of bracketData.first_four) {
        nameToRS[ff.teamA] = toRegionSeed(ff.region, ff.seed);
        nameToRS[ff.teamB] = toRegionSeed(ff.region, ff.seed);
      }
    }

    const dates: string[] = [];
    const now = new Date();
    for (let d = 0; d < daysBack; d++) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);
      dates.push(dt.toISOString().slice(0, 10).replace(/-/g, ""));
    }

    const allEvents: any[] = [];
    const seenIds = new Set<string>();
    for (const date of dates) {
      try {
        const res = await fetch(`${ESPN_SCOREBOARD}?dates=${date}&groups=100`, { cache: "no-store" });
        const data = await res.json();
        for (const e of data.events || []) {
          if (!seenIds.has(e.id)) { seenIds.add(e.id); allEvents.push(e); }
        }
      } catch {}
    }

    let updated = 0;
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const event of allEvents) {
      const comp = event.competitions?.[0];
      if (comp?.status?.type?.state !== "post") continue;
      const competitors = comp?.competitors || [];
      const winnerComp = competitors.find((c: any) => c.winner);
      const loserComp = competitors.find((c: any) => !c.winner);
      if (!winnerComp || !loserComp) continue;

      const winnerName = matchEspnName(winnerComp.team.shortDisplayName, ourTeams);
      const loserName = matchEspnName(loserComp.team.shortDisplayName, ourTeams);
      if (!winnerName || !loserName) {
        unmatched.push(`${winnerComp.team.shortDisplayName} vs ${loserComp.team.shortDisplayName}`);
        continue;
      }

      let foundGameId: string | null = null;
      for (const [gid, [tA, tB]] of gameTeams) {
        if ((tA === winnerName && tB === loserName) || (tA === loserName && tB === winnerName)) {
          foundGameId = gid;
          break;
        }
      }

      if (foundGameId && !results[foundGameId]) {
        results[foundGameId] = foundGameId.startsWith("ff-play-") ? winnerName : (nameToRS[winnerName] || winnerName);
        updated++;
        matched.push(`${foundGameId}: ${results[foundGameId]}`);
        const newGameTeams = buildGameTeams(bracketData, results);
        for (const [k, v] of newGameTeams) {
          if (!gameTeams.has(k)) gameTeams.set(k, v);
        }
      }
    }

    if (updated > 0) {
      db.prepare("UPDATE tournaments SET results_data = ?, results_updated_at = datetime('now') WHERE id = ?").run(
        JSON.stringify(results), tournament.id
      );
    }

    return { updated, matched, unmatched, totalResults: Object.keys(results).length };
  } finally {
    syncInProgress = false;
  }
}
