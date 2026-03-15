import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scorePicks } from "@/lib/scoring";

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
    .map((p) => ({ username: p.username, score: scorePicks(JSON.parse(p.picks_data), results) }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard });
}
