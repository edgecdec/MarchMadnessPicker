import { NextRequest, NextResponse } from "next/server";
import { getDb, autoAssignBracketToEveryone } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest) {
  const db = getDb();
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  const bracketName = req.nextUrl.searchParams.get("bracket_name");

  const tournaments = db.prepare("SELECT id, name, year, lock_time, bracket_data, results_data FROM tournaments ORDER BY year DESC").all();

  const user = await getUser();
  let userPicks: any = null;
  let userBrackets: any[] = [];
  let userTiebreaker: number | null = null;

  if (user && tournamentId) {
    // List all brackets for this user/tournament
    userBrackets = db.prepare(
      "SELECT id, bracket_name, submitted_at, tiebreaker FROM picks WHERE user_id = ? AND tournament_id = ? ORDER BY submitted_at ASC"
    ).all(user.id, tournamentId) as any[];

    // Load specific bracket or first one
    const name = bracketName || (userBrackets[0]?.bracket_name ?? null);
    if (name) {
      const row = db.prepare(
        "SELECT picks_data, tiebreaker FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?"
      ).get(user.id, tournamentId, name) as any;
      if (row) {
        userPicks = JSON.parse(row.picks_data);
        userTiebreaker = row.tiebreaker ?? null;
      }
    }
  }

  return NextResponse.json({ tournaments, userPicks, userBrackets, userTiebreaker });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json();
    const { tournament_id, picks_data, bracket_name = "My Bracket", action } = body;
    const tiebreaker = body.tiebreaker !== undefined ? body.tiebreaker : undefined;

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
      if (new_name.length > 32) return NextResponse.json({ error: "Bracket name max 32 characters" }, { status: 400 });
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
    if (bracket_name.length > 32) return NextResponse.json({ error: "Bracket name max 32 characters" }, { status: 400 });

    if (tournament.lock_time && new Date(tournament.lock_time) < new Date()) {
      return NextResponse.json({ error: "Picks are locked" }, { status: 403 });
    }

    // Check if any assigned group has submissions locked
    const existingPick = db.prepare("SELECT id FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .get(user.id, tournament_id, bracket_name) as any;
    if (existingPick) {
      const lockedGroup = db.prepare(`
        SELECT g.name FROM bracket_group_assignments bga
        JOIN groups g ON g.id = bga.group_id
        WHERE bga.pick_id = ? AND g.submissions_locked = 1 LIMIT 1
      `).get(existingPick.id) as any;
      if (lockedGroup) {
        return NextResponse.json({ error: `Submissions locked by group "${lockedGroup.name}"` }, { status: 403 });
      }
    }

    const pickId = uuid();
    const tiebreakerVal = tiebreaker != null ? Number(tiebreaker) : null;
    db.prepare(`
      INSERT INTO picks (id, user_id, tournament_id, bracket_name, picks_data, tiebreaker) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, tournament_id, bracket_name) DO UPDATE SET picks_data = ?, tiebreaker = ?, submitted_at = datetime('now')
    `).run(pickId, user.id, tournament_id, bracket_name, JSON.stringify(picks_data), tiebreakerVal, JSON.stringify(picks_data), tiebreakerVal);

    // Auto-assign to Everyone group
    const savedPick = db.prepare("SELECT id FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?")
      .get(user.id, tournament_id, bracket_name) as any;
    if (savedPick) autoAssignBracketToEveryone(db, savedPick.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/picks error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
