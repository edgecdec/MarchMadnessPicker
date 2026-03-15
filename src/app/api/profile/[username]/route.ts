import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { scorePicks, scorePicksByRound } from "@/lib/scoring";
import { DEFAULT_SCORING } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { username } = await params;
  const db = getDb();

  const target = db.prepare("SELECT id, username, created_at FROM users WHERE username = ?").get(username) as any;
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Groups the user belongs to, with their brackets in each group
  const groups = db.prepare(`
    SELECT g.id, g.name, g.invite_code,
      (SELECT COUNT(*) FROM group_members gm2 WHERE gm2.group_id = g.id) as member_count
    FROM groups g
    JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = ?
    ORDER BY g.created_at DESC
  `).all(target.id) as any[];

  // Brackets with scores
  const tournament = db.prepare("SELECT id, results_data, bracket_data FROM tournaments ORDER BY year DESC LIMIT 1").get() as any;
  let brackets: any[] = [];
  if (tournament) {
    const results = JSON.parse(tournament.results_data || "{}");
    const bracket = JSON.parse(tournament.bracket_data || "{}");
    const everyoneGroup = db.prepare("SELECT scoring_settings FROM groups WHERE id = 'everyone'").get() as any;
    const settings = everyoneGroup ? { ...DEFAULT_SCORING, ...JSON.parse(everyoneGroup.scoring_settings || "{}") } : DEFAULT_SCORING;

    const picks = db.prepare(
      "SELECT id, bracket_name, picks_data, tiebreaker, submitted_at FROM picks WHERE user_id = ? AND tournament_id = ?"
    ).all(target.id, tournament.id) as any[];

    brackets = picks.map((p) => {
      const pd = JSON.parse(p.picks_data);
      return {
        id: p.id,
        bracket_name: p.bracket_name,
        submitted_at: p.submitted_at,
        tiebreaker: p.tiebreaker,
        score: scorePicks(pd, results, settings, bracket.regions),
        roundScores: scorePicksByRound(pd, results, settings, bracket.regions),
      };
    });

    // Add bracket names to each group
    for (const g of groups) {
      const assigned = db.prepare(`
        SELECT p.bracket_name FROM bracket_group_assignments bga
        JOIN picks p ON p.id = bga.pick_id
        WHERE bga.group_id = ? AND p.user_id = ?
      `).all(g.id, target.id) as any[];
      g.brackets = assigned.map((a: any) => a.bracket_name);
    }
  }

  return NextResponse.json({
    username: target.username,
    created_at: target.created_at,
    groups,
    brackets,
  });
}
