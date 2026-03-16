import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { BracketData, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";

const ESPN_SCOREBOARD = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard";

// Reverse map: ESPN team ID -> our bracket team name
// Built from bracketData.ts ESPN_TEAM_IDS at runtime from tournament data
function buildEspnIdToName(bracketData: BracketData): Record<string, string> {
  // We need ESPN IDs. Import them from bracketData indirectly via the logo URL pattern.
  // Instead, build name matching from the bracket teams + ESPN shortDisplayName matching.
  // We'll match by team name similarity since ESPN IDs aren't exported from bracketData.
  const allTeams: string[] = [];
  for (const r of bracketData.regions) {
    for (const t of r.teams) allTeams.push(t.name);
  }
  if (bracketData.first_four) {
    for (const ff of bracketData.first_four) {
      allTeams.push(ff.teamA, ff.teamB);
    }
  }
  // Return a set of all our team names for matching
  return Object.fromEntries(allTeams.map(n => [n.toLowerCase(), n]));
}

// Common ESPN shortDisplayName -> our bracket name mappings
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
};

function matchEspnName(espnName: string, ourTeams: Record<string, string>): string | null {
  const lower = espnName.toLowerCase();
  // Direct match
  if (ourTeams[lower]) return ourTeams[lower];
  // Alias match
  if (ESPN_NAME_ALIASES[lower]) return ESPN_NAME_ALIASES[lower];
  // Fuzzy: try removing periods/dots
  const noDots = lower.replace(/\./g, "");
  if (ourTeams[noDots]) return ourTeams[noDots];
  // Try adding period after "St"
  for (const key of Object.keys(ourTeams)) {
    if (key.replace(/\./g, "") === noDots) return ourTeams[key];
  }
  return null;
}

// Build a map of which two teams play in each possible game
function buildGameTeams(
  bracketData: BracketData,
  results: Record<string, string>,
): Map<string, [string, string]> {
  const map = new Map<string, [string, string]>();
  const regions = bracketData.regions;

  // First Four games
  if (bracketData.first_four) {
    for (const ff of bracketData.first_four) {
      const gid = `ff-play-${ff.region}-${ff.seed}-${ff.slot}`;
      map.set(gid, [ff.teamA, ff.teamB]);
    }
  }

  // R64 games (round 0)
  for (const region of regions) {
    for (let i = 0; i < 8; i++) {
      const gid = `${region.name}-0-${i}`;
      const pair = SEED_ORDER_PAIRS[i];
      let teamA = region.teams.find(t => t.seed === pair[0])?.name;
      let teamB = region.teams.find(t => t.seed === pair[1])?.name;

      // Check if slot is a First Four play-in (resolved winner replaces the seed)
      if (bracketData.first_four) {
        for (const ff of bracketData.first_four) {
          if (ff.region === region.name && (ff.seed === pair[0] || ff.seed === pair[1])) {
            const ffGid = `ff-play-${ff.region}-${ff.seed}-${ff.slot}`;
            const ffWinner = results[ffGid];
            if (ffWinner) {
              if (ff.seed === pair[0]) teamA = ffWinner;
              else teamB = ffWinner;
            }
          }
        }
      }

      if (teamA && teamB) map.set(gid, [teamA, teamB]);
    }
  }

  // Rounds 1-3 (R32, S16, E8) — teams come from previous round winners
  for (const region of regions) {
    for (let round = 1; round <= 3; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        const gid = `${region.name}-${round}-${i}`;
        const teamA = results[`${region.name}-${round - 1}-${i * 2}`];
        const teamB = results[`${region.name}-${round - 1}-${i * 2 + 1}`];
        if (teamA && teamB) map.set(gid, [teamA, teamB]);
      }
    }
  }

  // Final Four (round 4): E8 winners
  if (regions.length >= 4) {
    const ff0a = results[`${regions[0].name}-3-0`];
    const ff0b = results[`${regions[2].name}-3-0`];
    if (ff0a && ff0b) map.set("ff-4-0", [ff0a, ff0b]);

    const ff1a = results[`${regions[1].name}-3-0`];
    const ff1b = results[`${regions[3].name}-3-0`];
    if (ff1a && ff1b) map.set("ff-4-1", [ff1a, ff1b]);
  }

  // Championship (round 5)
  const chA = results["ff-4-0"];
  const chB = results["ff-4-1"];
  if (chA && chB) map.set("ff-5-0", [chA, chB]);

  return map;
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const db = getDb();
  const tournament = db.prepare("SELECT * FROM tournaments ORDER BY year DESC LIMIT 1").get() as any;
  if (!tournament) return NextResponse.json({ error: "No tournament found" }, { status: 404 });

  const bracketData: BracketData = JSON.parse(tournament.bracket_data);
  const results: Record<string, string> = JSON.parse(tournament.results_data || "{}");
  const ourTeams = buildEspnIdToName(bracketData);
  const gameTeams = buildGameTeams(bracketData, results);

  // Fetch ESPN scoreboard for multiple dates (First Four through Championship)
  // Fetch without date to get current/recent games, plus we can pass date ranges
  const dates: string[] = [];
  const now = new Date();
  // Fetch last 21 days to cover entire tournament
  for (let d = 0; d < 21; d++) {
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
        if (!seenIds.has(e.id)) {
          seenIds.add(e.id);
          allEvents.push(e);
        }
      }
    } catch {}
  }

  let updated = 0;
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const event of allEvents) {
    const comp = event.competitions?.[0];
    const state = comp?.status?.type?.state;
    if (state !== "post") continue; // Only finished games

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

    // Find the game ID where these two teams play
    let foundGameId: string | null = null;
    for (const [gid, [tA, tB]] of gameTeams) {
      if ((tA === winnerName && tB === loserName) || (tA === loserName && tB === winnerName)) {
        foundGameId = gid;
        break;
      }
    }

    if (foundGameId && !results[foundGameId]) {
      results[foundGameId] = winnerName;
      updated++;
      matched.push(`${foundGameId}: ${winnerName}`);

      // Rebuild game teams map since new results may unlock later rounds
      const newGameTeams = buildGameTeams(bracketData, results);
      for (const [k, v] of newGameTeams) {
        if (!gameTeams.has(k)) gameTeams.set(k, v);
      }
    }
  }

  // Save updated results
  if (updated > 0) {
    db.prepare("UPDATE tournaments SET results_data = ?, results_updated_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(results), tournament.id
    );
  }

  return NextResponse.json({ ok: true, updated, matched, unmatched, totalResults: Object.keys(results).length });
}
