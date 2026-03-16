import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { scorePicksDetailed } from "@/lib/scoring";
import { DEFAULT_SCORING } from "@/types";
import { resolveRegionSeed } from "@/lib/bracketData";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const tournamentId = sp.get("tournament_id");
  const username = sp.get("username");
  const bracketName = sp.get("bracket_name");
  if (!tournamentId || !username) return NextResponse.json({ error: "tournament_id and username required" }, { status: 400 });

  const db = getDb();
  const tournament = db.prepare("SELECT results_data, bracket_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as any;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const pickRow = bracketName
    ? db.prepare("SELECT picks_data FROM picks WHERE user_id = ? AND tournament_id = ? AND bracket_name = ?").get(user.id, tournamentId, bracketName) as any
    : db.prepare("SELECT picks_data FROM picks WHERE user_id = ? AND tournament_id = ? ORDER BY submitted_at DESC LIMIT 1").get(user.id, tournamentId) as any;
  if (!pickRow) return NextResponse.json({ error: "Picks not found" }, { status: 404 });

  const everyoneGroup = db.prepare("SELECT scoring_settings FROM groups WHERE id = 'everyone'").get() as any;
  const settings = everyoneGroup ? { ...DEFAULT_SCORING, ...JSON.parse(everyoneGroup.scoring_settings || "{}") } : DEFAULT_SCORING;

  const results = JSON.parse(tournament.results_data || "{}");
  const bracket = JSON.parse(tournament.bracket_data || "{}");
  const picks = JSON.parse(pickRow.picks_data);

  return NextResponse.json({
    details: scorePicksDetailed(picks, results, settings, bracket.regions).map(d => ({
      ...d,
      pick: resolveRegionSeed(d.pick, bracket.regions, bracket.first_four, results),
      result: d.result ? resolveRegionSeed(d.result, bracket.regions, bracket.first_four, results) : null,
    })),
    settings,
  });
}
