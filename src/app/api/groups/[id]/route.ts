import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { scorePicks, maxPossibleRemaining, getEliminatedTeams } from "@/lib/scoring";
import { DEFAULT_SCORING } from "@/types";
import { resolveRegionSeed } from "@/lib/bracketData";
import { isTournamentLocked } from "@/lib/lockUtils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id: groupId } = await params;
  const tournamentId = req.nextUrl.searchParams.get("tournament_id");
  if (!tournamentId) return NextResponse.json({ error: "tournament_id required" }, { status: 400 });

  const db = getDb();
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(groupId) as any;
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

  const tournament = db.prepare("SELECT results_data, bracket_data, lock_time FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const results = JSON.parse(tournament.results_data || "{}");
  const bracket = JSON.parse(tournament.bracket_data || "{}");
  const settings = JSON.parse(group.scoring_settings || "{}");
  const scoring = { ...DEFAULT_SCORING, ...settings };
  const eliminated = getEliminatedTeams(results, bracket.regions);

  const members = db.prepare(`
    SELECT u.id as user_id, u.username, p.id as pick_id, p.picks_data, p.bracket_name, p.tiebreaker
    FROM group_members gm
    JOIN users u ON gm.user_id = u.id
    LEFT JOIN picks p ON p.user_id = u.id AND p.tournament_id = ?
    LEFT JOIN bracket_group_assignments bga ON bga.pick_id = p.id AND bga.group_id = ?
    WHERE gm.group_id = ? AND (p.id IS NULL OR bga.pick_id IS NOT NULL) AND u.is_hidden = 0
  `).all(tournamentId, groupId, groupId) as any[];

  const leaderboard = members
    .map((m) => {
      const picks = m.picks_data ? JSON.parse(m.picks_data) : {};
      const championPickRS = picks["ff-5-0"] || null;
      const championPick = championPickRS ? resolveRegionSeed(championPickRS, bracket.regions, bracket.first_four, results) : null;
      const ffPicks: Record<string, string> = {};
      for (const key of Object.keys(picks)) {
        if (key.endsWith("-3-0") || key.startsWith("ff-")) {
          ffPicks[key] = resolveRegionSeed(picks[key], bracket.regions, bracket.first_four, results);
        }
      }
      return {
        username: m.username,
        user_id: m.user_id,
        pick_id: m.pick_id || null,
        bracket_name: m.bracket_name || null,
        score: m.picks_data ? scorePicks(picks, results, scoring, bracket.regions) : 0,
        maxRemaining: m.picks_data ? maxPossibleRemaining(picks, results, scoring, bracket.regions) : 0,
        pick_count: m.picks_data ? Object.keys(picks).filter(k => !k.startsWith('ff-play-')).length : 0,
        tiebreaker: m.tiebreaker ?? null,
        championPick,
        busted: championPick ? eliminated.has(championPick) || (championPickRS ? eliminated.has(championPickRS) : false) : false,
        ffPicks,
        picks,
      };
    })
    .sort((a, b) => b.score - a.score);

  const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
  const locked = isTournamentLocked(tournament.lock_time);
  const leaderboardWithElim = leaderboard.map((e) => ({
    ...e,
    eliminated: (e.score + e.maxRemaining) < topScore,
    ...(locked ? {} : { ffPicks: {}, championPick: null, busted: false, picks: undefined }),
  }));

  return NextResponse.json({
    group: { ...group, scoring_settings: scoring },
    leaderboard: leaderboardWithElim,
  });
}
