import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scorePicks, maxPossibleRemaining } from "@/lib/scoring";
import { DEFAULT_SCORING } from "@/types";

export async function GET(req: NextRequest) {
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT results_data, bracket_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const everyoneGroup = db.prepare("SELECT scoring_settings FROM groups WHERE id = 'everyone'").get() as any;
  const settings = everyoneGroup ? { ...DEFAULT_SCORING, ...JSON.parse(everyoneGroup.scoring_settings || "{}") } : DEFAULT_SCORING;

  const results = JSON.parse(tournament.results_data || "{}");
  const bracket = JSON.parse(tournament.bracket_data || "{}");

  const allPicks = db.prepare(`
    SELECT p.picks_data, p.bracket_name, u.username
    FROM picks p JOIN users u ON p.user_id = u.id
    WHERE p.tournament_id = ?
  `).all(tournamentId) as any[];

  const leaderboard = allPicks
    .map((p) => {
      const picks = JSON.parse(p.picks_data);
      return {
        username: p.username,
        bracket_name: p.bracket_name,
        score: scorePicks(picks, results, settings, bracket.regions),
        maxRemaining: maxPossibleRemaining(picks, results, settings),
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard, scoring_settings: settings });
}
