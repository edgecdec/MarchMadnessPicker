import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { scorePicks } from "@/lib/scoring";
import { DEFAULT_SCORING } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: groupId } = await params;
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as any;
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const tournament = db.prepare("SELECT results_data, bracket_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const results = JSON.parse(tournament.results_data || "{}");
  const bracket = JSON.parse(tournament.bracket_data || "{}");
  const settings = JSON.parse(group.scoring_settings || "{}");
  const scoring = { ...DEFAULT_SCORING, ...settings };

  const members = db.prepare(`
    SELECT u.username, p.picks_data
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN picks p ON p.user_id = u.id AND p.tournament_id = ?
    WHERE gm.group_id = ?
  `).all(tournamentId, groupId) as any[];

  const leaderboard = members
    .map((m) => ({
      username: m.username,
      score: m.picks_data ? scorePicks(JSON.parse(m.picks_data), results, scoring, bracket.regions) : 0,
      has_picks: !!m.picks_data,
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    group: { ...group, scoring_settings: scoring },
    leaderboard,
  });
}
