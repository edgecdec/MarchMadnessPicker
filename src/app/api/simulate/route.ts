import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { DEFAULT_SCORING } from "@/types";

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const groupId = req.nextUrl.searchParams.get("group_id");
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!groupId || !tournamentId) return NextResponse.json({ error: "group_id and tournament_id required" }, { status: 400 });

  const db = getDb();
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as any;
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const tournament = db.prepare("SELECT bracket_data, results_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const settings = { ...DEFAULT_SCORING, ...JSON.parse(group.scoring_settings || "{}") };
  const bracket = JSON.parse(tournament.bracket_data || "{}");
  const results = JSON.parse(tournament.results_data || "{}");

  const members = db.prepare(`
    SELECT u.username, p.picks_data, p.bracket_name, p.tiebreaker
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN picks p ON p.user_id = u.id AND p.tournament_id = ?
    LEFT JOIN bracket_group_assignments bga ON bga.pick_id = p.id AND bga.group_id = ?
    WHERE gm.group_id = ? AND (p.id IS NULL OR bga.pick_id IS NOT NULL)
  `).all(tournamentId, groupId, groupId) as any[];

  const entries = members.map((m) => ({
    username: m.username,
    bracket_name: m.bracket_name || null,
    picks: m.picks_data ? JSON.parse(m.picks_data) : {},
    tiebreaker: m.tiebreaker ?? null,
  }));

  return NextResponse.json({ group: { id: group.id, name: group.name }, scoring: settings, bracket, results, entries });
}
