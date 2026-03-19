import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { BracketData, Region } from "@/types";
import { SEED_ORDER_PAIRS, resolveRegionSeed, parseRegionSeed } from "@/lib/bracketData";

export async function GET(req: NextRequest) {
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT bracket_data, lock_time FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Only show stats after lock
  if (!tournament.lock_time || new Date(tournament.lock_time) > new Date()) {
    return NextResponse.json({ stats: null });
  }

  const bracket: BracketData = JSON.parse(tournament.bracket_data);
  const regions = bracket.regions || [];

  // Build seed lookup
  const seedMap: Record<string, number> = {};
  for (const r of regions) for (const t of r.teams) seedMap[t.name] = t.seed;

  const rows = db.prepare(
    "SELECT p.picks_data, p.bracket_name, u.username FROM picks p JOIN users u ON p.user_id = u.id WHERE p.tournament_id = ? AND u.is_hidden = 0",
  ).all(tournamentId) as { picks_data: string; bracket_name: string; username: string }[];

  // Champion picks (ff-5-0)
  const championCounts: Record<string, number> = {};
  // Upset score per bracket (sum of seed diffs for upset picks)
  let biggestUpsetPick = { team: "", seed: 0, round: 0, count: 0 };
  // Chalk/contrarian scoring
  const bracketScores: { username: string; bracket_name: string; chalkScore: number }[] = [];

  // Precompute expected winners (lower seed = chalk pick) per game
  // For R64, chalk = lower seed number. For later rounds, we skip chalk calc on those.
  // Instead, count how many picks match the higher-seeded team (lower seed number).

  for (const row of rows) {
    const picks = JSON.parse(row.picks_data) as Record<string, string>;

    // Champion — resolve region-seed to name
    const champRS = picks["ff-5-0"];
    const champ = champRS ? resolveRegionSeed(champRS, regions, bracket.first_four) : undefined;
    if (champ) championCounts[champ] = (championCounts[champ] || 0) + 1;

    // Chalk score: for each pick, resolve to seed number
    let chalkScore = 0;
    for (const [gameId, val] of Object.entries(picks)) {
      const parsed = parseRegionSeed(val);
      const s = parsed ? parsed.seed : seedMap[val];
      if (s !== undefined) {
        chalkScore += 17 - s;
      }
    }
    bracketScores.push({ username: row.username, bracket_name: row.bracket_name, chalkScore });
  }

  // Find biggest upset picked: the pick with highest seed number that appears in later rounds
  // Look for the highest-seeded team picked to win in the latest round
  const upsetPicks: Record<string, { seed: number; round: number; count: number; name: string }> = {};
  for (const row of rows) {
    const picks = JSON.parse(row.picks_data) as Record<string, string>;
    for (const [gameId, val] of Object.entries(picks)) {
      const round = parseInt(gameId.split("-")[1]) || 0;
      const parsed = parseRegionSeed(val);
      const seed = parsed ? parsed.seed : seedMap[val];
      if (seed === undefined || seed <= 4) continue;
      const name = parsed ? resolveRegionSeed(val, regions, bracket.first_four) : val;
      const key = `${val}-R${round}`;
      if (!upsetPicks[key]) upsetPicks[key] = { seed, round, count: 0, name };
      upsetPicks[key].count++;
    }
  }
  // Rank by round desc then seed desc
  const sortedUpsets = Object.entries(upsetPicks)
    .sort(([, a], [, b]) => b.round - a.round || b.seed - a.seed);
  const topUpset = sortedUpsets[0];

  // Sort brackets by chalk score
  bracketScores.sort((a, b) => b.chalkScore - a.chalkScore);
  const totalBrackets = bracketScores.length;

  // Champion leaderboard
  const champions = Object.entries(championCounts)
    .map(([team, count]) => ({ team, count, pct: Math.round((count / totalBrackets) * 100), seed: seedMap[team] || 0 }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    stats: {
      totalBrackets,
      champions,
      biggestUpset: topUpset ? {
        team: topUpset[1].name,
        seed: topUpset[1].seed,
        round: topUpset[1].round,
        count: topUpset[1].count,
      } : null,
      mostChalk: bracketScores.length > 0 ? { username: bracketScores[0].username, bracket_name: bracketScores[0].bracket_name, score: bracketScores[0].chalkScore } : null,
      mostContrarian: bracketScores.length > 0 ? { username: bracketScores[totalBrackets - 1].username, bracket_name: bracketScores[totalBrackets - 1].bracket_name, score: bracketScores[totalBrackets - 1].chalkScore } : null,
    },
  });
}
