"use client";
import { useEffect, useMemo, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link, Tooltip, Popover, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry, ScoringSettings } from "@/types";
import { PickDetail } from "@/lib/scoring";
import { computeTrueMax } from "@/lib/trueMaxPossible";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import ScoringBreakdownDialog from "@/components/common/ScoringBreakdownDialog";
import MiniBracket from "@/components/bracket/MiniBracket";

const ROUND_LABELS = ["R64", "R32", "S16", "E8", "FF", "Champ"];

// Compute current hot streak: consecutive correct picks from most recent decided game backwards
function computeHotStreak(picks: Record<string, string> | undefined, results: Record<string, string>): number {
  if (!picks) return 0;
  const SCORABLE_RE = /^(East|West|South|Midwest)-[0-3]-\d+$|^ff-[45]-[01]$/;
  const decided = Object.keys(results).filter(g => SCORABLE_RE.test(g))
    .sort((a, b) => {
      const [, rA, iA] = a.split("-"), [, rB, iB] = b.split("-");
      return (+rA - +rB) || (+iA - +iB);
    });
  let streak = 0;
  for (let i = decided.length - 1; i >= 0; i--) {
    if (picks[decided[i]] === results[decided[i]]) streak++;
    else break;
  }
  return streak;
}

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, results, firstFour, loading: tournLoading } = useTournament();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [scoringSettings, setScoringSettings] = useState<ScoringSettings | null>(null);
  const [trueMax, setTrueMax] = useState<Record<string, number>>({});
  const [trueMaxComputing, setTrueMaxComputing] = useState(false);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownData, setBreakdownData] = useState<{ username: string; bracketName?: string | null; details: PickDetail[] }>({ username: "", details: [] });
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverEntry, setPopoverEntry] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (tournament) {
      api.leaderboard.get(tournament.id).then((d) => {
        setLeaderboard(d.leaderboard);
        setScoringSettings(d.scoring_settings);
      });
    }
  }, [tournament]);

  // Compute true max possible (with upset bonuses) in background
  useEffect(() => {
    if (!leaderboard.length || !regions?.length || !results || !scoringSettings) return;
    // Only compute if entries have picks data (locked tournament)
    if (!leaderboard.some(e => e.picks)) return;

    setTrueMaxComputing(true);
    let idx = 0;
    const maxMap: Record<string, number> = {};

    function computeNext() {
      if (idx >= leaderboard.length) {
        setTrueMax(maxMap);
        setTrueMaxComputing(false);
        return;
      }
      const entry = leaderboard[idx];
      const key = `${entry.username}|${entry.bracket_name || ""}`;
      if (entry.picks) {
        maxMap[key] = computeTrueMax(entry.picks, results, regions!, scoringSettings!);
      }
      idx++;
      // Update state progressively every 5 entries
      if (idx % 5 === 0 || idx === leaderboard.length) {
        setTrueMax({ ...maxMap });
      }
      setTimeout(computeNext, 0);
    }

    setTimeout(computeNext, 0);
  }, [leaderboard, regions, results, scoringSettings]);

  const openBreakdown = async (entry: LeaderboardEntry) => {
    if (!tournament) return;
    try {
      const { details } = await api.leaderboard.breakdown(tournament.id, entry.username, entry.bracket_name);
      setBreakdownData({ username: entry.username, bracketName: entry.bracket_name, details });
      setBreakdownOpen(true);
    } catch {}
  };

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  const userBestRank = leaderboard.length > 0
    ? leaderboard.findIndex((e) => e.username === user?.username)
    : -1;
  const percentile = userBestRank >= 0 && leaderboard.length > 1
    ? Math.round(((leaderboard.length - 1 - userBestRank) / (leaderboard.length - 1)) * 100)
    : null;

  const locked = tournament?.lock_time ? new Date(tournament.lock_time) <= new Date() : false;

  // Compute unique correct picks: games where exactly one bracket got it right
  const uniquePicks = useMemo(() => {
    if (!locked || !results) return {};
    const SCORABLE_RE = /^(East|West|South|Midwest)-[0-3]-\d+$|^ff-[45]-[01]$/;
    const decided = Object.keys(results).filter(g => SCORABLE_RE.test(g));
    const map: Record<string, string[]> = {}; // key -> team names
    for (const g of decided) {
      const correct = leaderboard.filter(e => e.picks?.[g] === results[g]);
      if (correct.length === 1) {
        const key = `${correct[0].username}|${correct[0].bracket_name || ""}`;
        (map[key] ??= []).push(results[g]);
      }
    }
    return map;
  }, [locked, results, leaderboard]);

  // Compute tied ranks: same score = same rank, displayed as "T-X" when tied
  const ranks = leaderboard.map((entry, i) => {
    const rank = leaderboard.findIndex((e) => e.score === entry.score) + 1;
    const tied = leaderboard.filter((e) => e.score === entry.score).length > 1;
    return tied ? `T-${rank}` : `${rank}`;
  });

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Leaderboard</Typography>
        {percentile !== null && (
          <Typography variant="body1" sx={{ mb: 2 }} color="primary">
            Your bracket is in the {percentile === 0 ? "0th" : `${percentile}${percentile % 10 === 1 && percentile !== 11 ? "st" : percentile % 10 === 2 && percentile !== 12 ? "nd" : percentile % 10 === 3 && percentile !== 13 ? "rd" : "th"}`} percentile
          </Typography>
        )}
        {leaderboard.length === 0 ? (
          <Typography color="text.secondary">No picks submitted yet.</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: "sticky", left: 0, zIndex: 3, bgcolor: "background.paper" }}>Rank</TableCell>
                  <TableCell sx={{ position: "sticky", left: 48, zIndex: 3, bgcolor: "background.paper" }}>Player</TableCell>
                  {ROUND_LABELS.map((l) => (
                    <TableCell key={l} align="right">{l}</TableCell>
                  ))}
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Max Possible</TableCell>
                  <TableCell align="right">Best Finish</TableCell>
                  {locked && <TableCell align="right">Tiebreaker</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry, i) => (
                  <TableRow key={`${entry.username}-${entry.bracket_name || i}`}>
                    <TableCell sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: "background.paper" }}>{ranks[i]}</TableCell>
                    <TableCell
                      onMouseEnter={(e) => { if (locked && entry.ffPicks && Object.keys(entry.ffPicks).length > 0) { setPopoverAnchor(e.currentTarget); setPopoverEntry(entry); } }}
                      onMouseLeave={() => { setPopoverAnchor(null); setPopoverEntry(null); }}
                      sx={{ position: "sticky", left: 48, zIndex: 1, bgcolor: "background.paper", maxWidth: 110, whiteSpace: "nowrap", cursor: locked && entry.ffPicks ? "default" : undefined }}
                    >
                      <Tooltip title={`${entry.username}${entry.bracket_name ? ` — ${entry.bracket_name}` : ""}`}>
                        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                          <Link href={`/bracket/${entry.username}`} underline="hover" sx={{ fontSize: "0.8rem" }}>{entry.username.length > 8 ? entry.username.slice(0, 7) + "…" : entry.username}</Link>
                          {entry.bracket_name && <Box component="span" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>{` · ${entry.bracket_name.length > 6 ? entry.bracket_name.slice(0, 5) + "…" : entry.bracket_name}`}</Box>}
                        </Box>
                      </Tooltip>
                      {locked && entry.busted && <Tooltip title={`Championship pick eliminated: ${entry.championPick}`}><span> 💀</span></Tooltip>}{locked && entry.eliminated && <Tooltip title="Eliminated from contention — cannot catch the leader"><span> 🚫</span></Tooltip>}{locked && (() => { const s = computeHotStreak(entry.picks, results || {}); return s >= 5 ? <Tooltip title={`${s} correct picks in a row`}><span> 🔥{s}</span></Tooltip> : null; })()}{locked && regions && (() => { const e8Keys = regions.map(r => `${r.name}-3-0`); const allDecided = e8Keys.every(k => results?.[k]); if (!allDecided || !entry.picks) return null; const gotAny = e8Keys.some(k => entry.picks![k] === results![k]); return !gotAny ? <Tooltip title="Entire Final Four wrong"><span> 🤡</span></Tooltip> : null; })()}{(() => { const key = `${entry.username}|${entry.bracket_name || ""}`; const u = uniquePicks[key]; return u?.length ? <Tooltip title={`Only one to pick: ${u.join(", ")}`}><span> 😱</span></Tooltip> : null; })()}
                    </TableCell>
                    {(entry.roundScores || [0,0,0,0,0,0]).map((s, r) => (
                      <TableCell key={r} align="right">{s}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: "bold", cursor: "pointer", textDecoration: "underline", "&:hover": { color: "primary.main" } }} onClick={() => openBreakdown(entry)}>{entry.score}</TableCell>
                    <TableCell align="right">{(() => {
                      const key = `${entry.username}|${entry.bracket_name || ""}`;
                      if (trueMax[key] != null) return trueMax[key];
                      if (entry.picks && trueMaxComputing) return "⏳";
                      return entry.score + (entry.maxRemaining ?? 0);
                    })()}</TableCell>
                    <TableCell align="right">{entry.bestPossibleFinish ? `#${entry.bestPossibleFinish}` : "—"}</TableCell>
                    {locked && <TableCell align="right">{entry.tiebreaker != null ? entry.tiebreaker : "—"}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <ScoringBreakdownDialog
          open={breakdownOpen}
          onClose={() => setBreakdownOpen(false)}
          username={breakdownData.username}
          bracketName={breakdownData.bracketName}
          details={breakdownData.details}
        />
        <Popover
          open={!!popoverAnchor && !!popoverEntry}
          anchorEl={popoverAnchor}
          onClose={() => { setPopoverAnchor(null); setPopoverEntry(null); }}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          sx={{ pointerEvents: "none" }}
          disableRestoreFocus
        >
          <Box sx={{ p: 1 }}>
            {popoverEntry?.ffPicks && regions && (
              <MiniBracket regions={regions} picks={popoverEntry.ffPicks} results={results} firstFour={firstFour} />
            )}
          </Box>
        </Popover>
      </Container>
    </>
  );
}
