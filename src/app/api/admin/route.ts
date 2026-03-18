import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { autoFillIncompleteBrackets } from "@/lib/autoFillAtLock";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user?.is_admin) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { action, ...data } = await req.json();
  const db = getDb();

  if (action === "create_tournament") {
    const id = uuid();
    db.prepare("INSERT INTO tournaments (id, name, year, bracket_data, lock_time) VALUES (?, ?, ?, ?, ?)").run(
      id, data.name, data.year, JSON.stringify(data.bracket_data || {}), data.lock_time || null
    );
    return NextResponse.json({ id });
  }

  if (action === "update_bracket") {
    db.prepare("UPDATE tournaments SET bracket_data = ? WHERE id = ?").run(
      JSON.stringify(data.bracket_data), data.tournament_id
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "update_results") {
    db.prepare("UPDATE tournaments SET results_data = ?, results_updated_at = datetime('now') WHERE id = ?").run(
      JSON.stringify(data.results_data), data.tournament_id
    );
    return NextResponse.json({ ok: true });
  }

  if (action === "autofill_lock") {
    const count = autoFillIncompleteBrackets(data.tournament_id);
    return NextResponse.json({ ok: true, filled: count });
  }

  if (action === "search_users") {
    const q = (data.query || "").trim();
    if (!q) return NextResponse.json({ users: [] });
    const users = db.prepare("SELECT id, username FROM users WHERE username LIKE ? LIMIT 20").all(`%${q}%`) as any[];
    return NextResponse.json({ users });
  }

  if (action === "get_user_brackets") {
    const brackets = db.prepare("SELECT id, bracket_name, tournament_id FROM picks WHERE user_id = ?").all(data.user_id) as any[];
    return NextResponse.json({ brackets });
  }

  if (action === "admin_add_to_group") {
    const { user_id: targetUserId, group_id, pick_ids } = data;
    if (!targetUserId || !group_id) return NextResponse.json({ error: "user_id and group_id required" }, { status: 400 });
    // Add user to group if not already a member
    db.prepare("INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)").run(group_id, targetUserId);
    // Assign brackets if provided
    if (pick_ids?.length) {
      const ins = db.prepare("INSERT OR IGNORE INTO bracket_group_assignments (pick_id, group_id) VALUES (?, ?)");
      for (const pid of pick_ids) ins.run(pid, group_id);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
