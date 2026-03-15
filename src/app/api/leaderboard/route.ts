import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const POINTS_PER_ROUND = [1, 2, 4, 8, 16, 32];

function scorePicks(picks: Record<string, string>, results: Record<string, string>): number {
  let score = 0;
  for (const [game, winner] of Object.entries(results)) {
    if (picks[game] === winner) {
      const round = parseInt(game.split("-")[0]) || 0;
      score += POINTS_PER_ROUND[round] || 0;
    }
  }
  return score;
}

export async function GET(req: NextRequest) {
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT results_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const results = JSON.parse(tournament.results_data || "{}");
  const allPicks = db.prepare(`
    SELECT p.picks_data, u.username FROM picks p JOIN users u ON p.user_id = u.id WHERE p.tournament_id = ?
  `).all(tournamentId) as any[];

  const leaderboard = allPicks
    .map((p) => ({
      username: p.username,
      score: scorePicks(JSON.parse(p.picks_data), results),
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard });
}
