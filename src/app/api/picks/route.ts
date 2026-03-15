import { NextRequest, NextResponse } from "next/server";
import { getDb, autoAssignBracketToEveryone } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const db = getDb();
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  const bracketName = req.nextUrl.searchParams.get("bracket_name");

  const tournaments = db.prepare("SELECT id, name, year, lock_time, bracket_data, results_data FROM tournaments ORDER BY year DESC").all();

  const user = await getUser();
  let userPicks: any = null;
  let userBrackets: any[] = [];

  if (user && tournamentId) {
    // List all brackets for this user/tournament
    userBrackets = db.prepare(
      "SELECT id, bracket_name, submitted_at FROM picks WHERE user_id = ? AND tournament_id = ? ORDER BY submitted_at ASC"
    ).all(user.id, tournamentId) as any[];

    // Load specific bracket or first one
    const name = bracketName || (userBrackets[0]?.bracket_name ?? null);
    if (name) {
      const row = db.prepare(
        "SELECT picks_data FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?"
      ).get(user.id, tournamentId, name) as any;
      if (row) userPicks = JSON.parse(row.picks_data);
    }
  }

  return NextResponse.json({ tournaments, userPicks, userBrackets });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { tournament_id, picks_data, bracket_name = "My Bracket", action } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: "tournament_id required" }, { status: 400 });
  }

  const db = getDb();
  const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournament_id) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Delete bracket
  if (action === "delete_bracket") {
    if (!bracket_name) return NextResponse.json({ error: "bracket_name required" }, { status: 400 });
    const pick = db.prepare("SELECT id FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .get(user.id, tournament_id, bracket_name) as any;
    if (pick) {
      db.prepare("DELETE FROM bracket_group_assignments WHERE pick_id = ?").run(pick.id);
    }
    db.prepare("DELETE FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .run(user.id, tournament_id, bracket_name);
    return NextResponse.json({ ok: true });
  }

  // Rename bracket
  if (action === "rename_bracket") {
    const { new_name } = body;
    if (!new_name) return NextResponse.json({ error: "new_name required" }, { status: 400 });
    const existing = db.prepare("SELECT id FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .get(user.id, tournament_id, new_name);
    if (existing) return NextResponse.json({ error: "A bracket with that name already exists" }, { status: 409 });
    db.prepare("UPDATE picks SET bracket_name = ? WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .run(new_name, user.id, tournament_id, bracket_name);
    return NextResponse.json({ ok: true });
  }

  // Save picks
  if (!picks_data) {
    return NextResponse.json({ error: "picks_data required" }, { status: 400 });
  }

  if (tournament.lock_time && new Date(tournament.lock_time) < new Date()) {
    return NextResponse.json({ error: "Picks are locked" }, { status: 403 });
  }

  const { v4: uuid } = require("uuid");
  const pickId = uuid();
  db.prepare(`
    INSERT INTO picks (id, user_id, tournament_id, bracket_name, picks_data) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, tournament_id, bracket_name) DO UPDATE SET picks_data = ?, submitted_at = datetime('now')
  `).run(pickId, user.id, tournament_id, bracket_name, JSON.stringify(picks_data), JSON.stringify(picks_data));

  // Auto-assign to Everyone group
  const savedPick = db.prepare("SELECT id FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
    .get(user.id, tournament_id, bracket_name) as any;
  if (savedPick) autoAssignBracketToEveryone(db, savedPick.id);

  return NextResponse.json({ ok: true });
}
