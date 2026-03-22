"use client";
import { useEffect, useMemo, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper, Link, Tooltip, Popover, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry, ScoringSettings } from "@/types";
import { PickDetail, scorePicksDetailed } from "@/lib/scoring";
import { computeTrueMax } from "@/lib/trueMaxPossible";
import { resolveRegionSeed } from "@/lib/bracketData";
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
  const [breakdownRound, setBreakdownRound] = useState<number | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverEntry, setPopoverEntry] = useState<LeaderboardEntry | null>(null);
  const [orderBy, setOrderBy] = useState<string>("score");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

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

  // Recompute bestPossibleFinish using trueMax values (includes upset bonuses)
  const trueBestFinish = useMemo(() => {
    if (!Object.keys(trueMax).length) return {};
    const map: Record<string, number> = {};
    for (const entry of leaderboard) {
      const key = `${entry.username}|${entry.bracket_name || ""}`;
      const myMax = trueMax[key];
      if (myMax == null) continue;
      map[key] = leaderboard.filter(o => o.score > myMax).length + 1;
    }
    return map;
  }, [trueMax, leaderboard]);

  const handleSort = (col: string) => {
    const ascDefault = col === "player" || col === "best" || col === "rank" || col === "tb";
    if (orderBy === col) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(col);
      setOrder(ascDefault ? "asc" : "desc");
    }
  };

  const locked = tournament?.lock_time ? new Date(tournament.lock_time) <= new Date() : false;

  // Compute unique correct picks: games where exactly one bracket got it right
  const uniquePicks = useMemo(() => {
    if (!locked || !results || !regions) return {};
    const SCORABLE_RE = /^(East|West|South|Midwest)-[0-3]-\d+$|^ff-[45]-[01]$/;
    const RND = ["R64", "R32", "Sweet 16", "Elite 8", "Final Four", "Championship"];
    const decided = Object.keys(results).filter(g => SCORABLE_RE.test(g));
    const map: Record<string, string[]> = {};
    const threshold = Math.max(1, Math.floor(leaderboard.length * 0.05));
    for (const g of decided) {
      const correct = leaderboard.filter(e => e.picks?.[g] === results[g]);
      if (correct.length >= 1 && correct.length <= threshold) {
        const teamName = resolveRegionSeed(results[g], regions, firstFour ?? undefined, results);
        const round = g.startsWith("ff-") ? RND[parseInt(g.split("-")[1])] : RND[parseInt(g.split("-")[1])];
        const label = `${teamName} in ${round}`;
        for (const c of correct) {
          const key = `${c.username}|${c.bracket_name || ""}`;
          (map[key] ??= []).push(label);
        }
      }
    }
    return map;
  }, [locked, results, leaderboard, regions, firstFour]);

  // Compute total upset bonus per entry
  const bonusMap = useMemo(() => {
    if (!locked || !results || !regions || !scoringSettings) return {};
    const map: Record<string, number> = {};
    for (const entry of leaderboard) {
      if (!entry.picks) continue;
      const key = `${entry.username}|${entry.bracket_name || ""}`;
      const details = scorePicksDetailed(entry.picks, results, scoringSettings, regions);
      map[key] = details.reduce((sum, d) => sum + d.upsetBonus, 0);
    }
    return map;
  }, [locked, results, regions, scoringSettings, leaderboard]);

  // Sort leaderboard for display — must be before early returns to preserve hook order
  const sortedIndices = useMemo(() => {
    const indices = leaderboard.map((_, i) => i);
    indices.sort((a, b) => {
      const ea = leaderboard[a], eb = leaderboard[b];
      let va: number, vb: number;
      if (orderBy === "rank") {
        va = leaderboard.findIndex(e => e.score === ea.score) + 1;
        vb = leaderboard.findIndex(e => e.score === eb.score) + 1;
      } else if (orderBy === "player") {
        const na = `${ea.username}${ea.bracket_name || ""}`.toLowerCase();
        const nb = `${eb.username}${eb.bracket_name || ""}`.toLowerCase();
        return order === "asc" ? na.localeCompare(nb) : nb.localeCompare(na);
      } else if (orderBy.startsWith("r")) {
        const ri = parseInt(orderBy.slice(1));
        va = (ea.roundScores || [])[ri] || 0;
        vb = (eb.roundScores || [])[ri] || 0;
      } else if (orderBy === "score") {
        va = ea.score; vb = eb.score;
      } else if (orderBy === "bonus") {
        const ka = `${ea.username}|${ea.bracket_name || ""}`;
        const kb = `${eb.username}|${eb.bracket_name || ""}`;
        va = bonusMap[ka] || 0; vb = bonusMap[kb] || 0;
      } else if (orderBy === "max") {
        const ka = `${ea.username}|${ea.bracket_name || ""}`;
        const kb = `${eb.username}|${eb.bracket_name || ""}`;
        va = trueMax[ka] ?? (ea.score + (ea.maxRemaining ?? 0));
        vb = trueMax[kb] ?? (eb.score + (eb.maxRemaining ?? 0));
      } else if (orderBy === "best") {
        const ka = `${ea.username}|${ea.bracket_name || ""}`;
        const kb = `${eb.username}|${eb.bracket_name || ""}`;
        va = trueBestFinish[ka] ?? ea.bestPossibleFinish ?? 999;
        vb = trueBestFinish[kb] ?? eb.bestPossibleFinish ?? 999;
      } else if (orderBy === "tb") {
        va = ea.tiebreaker ?? 999;
        vb = eb.tiebreaker ?? 999;
      } else {
        va = 0; vb = 0;
      }
      return order === "asc" ? va! - vb! : vb! - va!;
    });
    return indices;
  }, [leaderboard, orderBy, order, bonusMap, trueMax, trueBestFinish]);

  const openBreakdown = async (entry: LeaderboardEntry, round?: number) => {
    if (!tournament) return;
    try {
      const { details } = await api.leaderboard.breakdown(tournament.id, entry.username, entry.bracket_name);
      setBreakdownData({ username: entry.username, bracketName: entry.bracket_name, details });
      setBreakdownRound(round ?? null);
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

  const hasUpsetBonus = locked && scoringSettings?.upsetBonusPerRound?.some(b => b > 0);

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
          <TableContainer component={Paper} sx={{ overflowX: "auto", maxHeight: "75vh" }}>
            <Table size="small" stickyHeader sx={{ tableLayout: "fixed" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ position: "sticky", left: 0, top: 0, zIndex: 4, bgcolor: "background.paper", width: 28, minWidth: 28, maxWidth: 28, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "rank"} direction={orderBy === "rank" ? order : "desc"} onClick={() => handleSort("rank")}>#</TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ position: "sticky", left: 28, top: 0, zIndex: 4, bgcolor: "background.paper", width: 130, minWidth: 130, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "player"} direction={orderBy === "player" ? order : "asc"} onClick={() => handleSort("player")}>Player</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ position: "sticky", left: 158, top: 0, zIndex: 4, bgcolor: "background.paper", borderLeft: 1, borderColor: "divider", width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "score"} direction={orderBy === "score" ? order : "desc"} onClick={() => handleSort("score")}>Tot</TableSortLabel>
                  </TableCell>
                  {hasUpsetBonus && <TableCell align="right" sx={{ width: 32, minWidth: 32, maxWidth: 32, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "bonus"} direction={orderBy === "bonus" ? order : "desc"} onClick={() => handleSort("bonus")}>Bon</TableSortLabel>
                  </TableCell>}
                  <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "max"} direction={orderBy === "max" ? order : "desc"} onClick={() => handleSort("max")}>Max</TableSortLabel>
                  </TableCell>
                  {ROUND_LABELS.map((l, ri) => (
                    <TableCell key={l} align="right" sx={{ width: 32, minWidth: 32, maxWidth: 32, px: 0.5, fontSize: "0.8rem" }}>
                      <TableSortLabel active={orderBy === `r${ri}`} direction={orderBy === `r${ri}` ? order : "desc"} onClick={() => handleSort(`r${ri}`)}>{l}</TableSortLabel>
                    </TableCell>
                  ))}
                  {locked && <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.8rem" }}>
                    <TableSortLabel active={orderBy === "tb"} direction={orderBy === "tb" ? order : "asc"} onClick={() => handleSort("tb")}>TB</TableSortLabel>
                  </TableCell>}
                  <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.8rem" }}>
                    <Tooltip title="Best possible rank if remaining games go optimally for this bracket">
                      <TableSortLabel active={orderBy === "best"} direction={orderBy === "best" ? order : "asc"} onClick={() => handleSort("best")}>Best</TableSortLabel>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedIndices.map((idx) => { const entry = leaderboard[idx]; const i = idx; const isOwn = entry.username === user?.username; return (
                  <TableRow key={`${entry.username}-${entry.bracket_name || idx}`} sx={isOwn ? { bgcolor: "action.selected", borderLeft: 3, borderColor: "primary.main" } : undefined}>
                    <TableCell sx={{ position: "sticky", left: 0, zIndex: 1, bgcolor: isOwn ? "action.selected" : "background.paper", width: 28, minWidth: 28, maxWidth: 28, px: 0.5, fontSize: "0.8rem" }}>{ranks[i]}</TableCell>
                    <TableCell
                      onMouseEnter={(e) => { if (locked && entry.ffPicks && Object.keys(entry.ffPicks).length > 0) { setPopoverAnchor(e.currentTarget); setPopoverEntry(entry); } }}
                      onMouseLeave={() => { setPopoverAnchor(null); setPopoverEntry(null); }}
                      sx={{ position: "sticky", left: 28, zIndex: 1, bgcolor: isOwn ? "action.selected" : "background.paper", width: 130, minWidth: 130, whiteSpace: "nowrap", cursor: locked && entry.ffPicks ? "default" : undefined, py: 0.5, px: 0.5 }}
                    >
                      <Tooltip title={`${entry.username}${entry.bracket_name ? ` — ${entry.bracket_name}` : ""}`}>
                        <Box sx={{ display: "flex", alignItems: "center", width: 120, maxWidth: 120 }}>
                          <Box sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0, flex: 1 }}>
                            <Link href={`/bracket/${entry.username}`} underline="hover" sx={{ fontSize: "0.8rem" }}>{entry.username.length > 8 ? entry.username.slice(0, 8) + "…" : entry.username}</Link>
                            {entry.bracket_name && <Box component="span" sx={{ color: "text.secondary", fontSize: "0.8rem" }}>{" - "}{entry.bracket_name.length > 6 ? entry.bracket_name.slice(0, 6) + "…" : entry.bracket_name}</Box>}
                          </Box>
                          <Box component="span" sx={{ flexShrink: 0, ml: 0.5, fontSize: "0.8rem" }}>
                            {locked && entry.busted && <Tooltip title={`Championship pick eliminated: ${entry.championPick}`}><span>💀</span></Tooltip>}{locked && entry.eliminated && <Tooltip title="Eliminated from contention — cannot catch the leader"><span>🚫</span></Tooltip>}{locked && (() => { const s = computeHotStreak(entry.picks, results || {}); return s >= 5 ? <Tooltip title={`${s} correct picks in a row`}><span>🔥{s}</span></Tooltip> : null; })()}{locked && regions && (() => { const e8Keys = regions.map(r => `${r.name}-3-0`); const allDecided = e8Keys.every(k => results?.[k]); if (!allDecided || !entry.picks) return null; const gotAny = e8Keys.some(k => entry.picks![k] === results![k]); return !gotAny ? <Tooltip title="Entire Final Four wrong"><span>🤡</span></Tooltip> : null; })()}{(() => { const key = `${entry.username}|${entry.bracket_name || ""}`; const u = uniquePicks[key]; return u?.length ? <Tooltip title={`Rare correct pick (≤5%): ${u.join(", ")}`}><span>😱{u.length}</span></Tooltip> : null; })()}
                          </Box>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right" sx={{ position: "sticky", left: 158, zIndex: 1, bgcolor: isOwn ? "action.selected" : "background.paper", borderLeft: 1, borderColor: "divider", fontWeight: "bold", width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline", "&:hover": { color: "primary.main" } }} onClick={() => openBreakdown(entry)}>{entry.score}</TableCell>
                    {hasUpsetBonus && <TableCell align="right" sx={{ width: 32, minWidth: 32, maxWidth: 32, px: 0.5, fontSize: "0.85rem" }}>{bonusMap[`${entry.username}|${entry.bracket_name || ""}`] || 0}</TableCell>}
                    <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.85rem" }}>{(() => {
                      const key = `${entry.username}|${entry.bracket_name || ""}`;
                      if (trueMax[key] != null) return trueMax[key];
                      if (entry.picks && trueMaxComputing) return "⏳";
                      return entry.score + (entry.maxRemaining ?? 0);
                    })()}</TableCell>
                    {(entry.roundScores || [0,0,0,0,0,0]).map((s, r) => (
                      <TableCell key={r} align="right" sx={{ width: 32, minWidth: 32, maxWidth: 32, px: 0.5, fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline", "&:hover": { color: "primary.main" } }} onClick={() => openBreakdown(entry, r)}>{s}</TableCell>
                    ))}
                    {locked && <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.85rem" }}>{entry.tiebreaker != null ? entry.tiebreaker : "—"}</TableCell>}
                    <TableCell align="right" sx={{ width: 36, minWidth: 36, maxWidth: 36, px: 0.5, fontSize: "0.85rem" }}>{(() => {
                      const key = `${entry.username}|${entry.bracket_name || ""}`;
                      if (trueBestFinish[key] != null) return `#${trueBestFinish[key]}`;
                      if (entry.picks && trueMaxComputing) return "⏳";
                      return entry.bestPossibleFinish ? `#${entry.bestPossibleFinish}` : "—";
                    })()}</TableCell>
                  </TableRow>
                ); })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <ScoringBreakdownDialog
          open={breakdownOpen}
          onClose={() => { setBreakdownOpen(false); setBreakdownRound(null); }}
          username={breakdownData.username}
          bracketName={breakdownData.bracketName}
          details={breakdownData.details}
          filterRound={breakdownRound}
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
