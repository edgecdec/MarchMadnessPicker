import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const tournaments = db.prepare("SELECT id, name, year, lock_time FROM tournaments ORDER BY year DESC").all();
  return NextResponse.json({ tournaments });
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { tournament_id, picks_data } = await req.json();
  if (!tournament_id || !picks_data) {
    return NextResponse.json({ error: "tournament_id and picks_data required" }, { status: 400 });
  }

  const db = getDb();
  const tournament = db.prepare("SELECT * FROM tournaments WHERE id = ?").get(tournament_id) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  if (tournament.lock_time && new Date(tournament.lock_time) < new Date()) {
    return NextResponse.json({ error: "Picks are locked" }, { status: 403 });
  }

  const { v4: uuid } = require("uuid");
  db.prepare(`
    INSERT INTO picks (id, user_id, tournament_id, picks_data) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, tournament_id) DO UPDATE SET picks_data = ?, submitted_at = datetime('now')
  `).run(uuid(), user.id, tournament_id, JSON.stringify(picks_data), JSON.stringify(picks_data));

  return NextResponse.json({ ok: true });
}
