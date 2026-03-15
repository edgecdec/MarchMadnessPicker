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

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
