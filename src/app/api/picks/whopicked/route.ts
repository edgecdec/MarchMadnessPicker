import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("group_id");
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!groupId || !tournamentId) return NextResponse.json({ error: "group_id and tournament_id required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT lock_time, bracket_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Only show after lock
  if (!tournament.lock_time || new Date(tournament.lock_time) > new Date()) {
    return NextResponse.json({ games: {} });
  }

  const group = db.prepare("SELECT id FROM groups WHERE id = ?").get(groupId) as any;
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const members = db.prepare(`
    SELECT u.username, p.picks_data, p.bracket_name
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN picks p ON p.user_id = u.id AND p.tournament_id = ?
    LEFT JOIN bracket_group_assignments bga ON bga.pick_id = p.id AND bga.group_id = ?
    WHERE gm.group_id = ? AND (p.id IS NULL OR bga.pick_id IS NOT NULL)
  `).all(tournamentId, groupId, groupId) as any[];

  // games: { [gameId]: { [teamName]: { count, users: [{username, bracket_name}] } } }
  const games: Record<string, Record<string, { count: number; users: { username: string; bracket_name: string | null }[] }>> = {};

  for (const m of members) {
    if (!m.picks_data) continue;
    const picks = JSON.parse(m.picks_data) as Record<string, string>;
    for (const [gameId, team] of Object.entries(picks)) {
      if (!games[gameId]) games[gameId] = {};
      if (!games[gameId][team]) games[gameId][team] = { count: 0, users: [] };
      games[gameId][team].count++;
      games[gameId][team].users.push({ username: m.username, bracket_name: m.bracket_name || null });
    }
  }

  return NextResponse.json({ games });
}
