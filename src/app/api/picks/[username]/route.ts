import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { username } = await params;
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  const bracketName = req.nextUrl.searchParams.get("bracket_name");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT lock_time FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  if (username !== user.username) {
    if (!tournament.lock_time || new Date(tournament.lock_time) > new Date()) {
      return NextResponse.json({ error: "Picks are hidden until lock time" }, { status: 403 });
    }
  }

  const target = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as any;
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // List all brackets for this user
  const brackets = db.prepare(
    "SELECT id, bracket_name, submitted_at FROM picks WHERE user_id = ? AND tournament_id = ? ORDER BY submitted_at ASC"
  ).all(target.id, tournamentId) as any[];

  const name = bracketName || (brackets[0]?.bracket_name ?? null);
  let picks = null;
  if (name) {
    const row = db.prepare(
      "SELECT picks_data FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?"
    ).get(target.id, tournamentId, name) as any;
    if (row) picks = JSON.parse(row.picks_data);
  }

  return NextResponse.json({ username, picks, brackets });
}
