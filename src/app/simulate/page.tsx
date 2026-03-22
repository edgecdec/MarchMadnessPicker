"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, Drawer, useMediaQuery, useTheme, IconButton,
  Menu, Collapse, Tooltip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { useMonteCarlo } from "@/hooks/useMonteCarlo";
import { useGameScores } from "@/hooks/useGameScores";
import { api } from "@/lib/api";
import { scorePicks } from "@/lib/scoring";
import { ScoringSettings, Region, Team, FirstFourGame } from "@/types";
import { toRegionSeed, getTeamRegion, parseRegionSeed } from "@/lib/bracketData";
import RegionBracket from "@/components/bracket/RegionBracket";
import FinalFour from "@/components/bracket/FinalFour";
import MobileBracket from "@/components/bracket/MobileBracket";
import MediumBracket from "@/components/bracket/MediumBracket";
import MonteCarloTable from "@/components/bracket/MonteCarloTable";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import { isTournamentLocked } from "@/lib/lockUtils";

interface SimEntry {
  username: string;
  bracket_name: string | null;
  picks: Record<string, string>;
  tiebreaker: number | null;
}

function allGameIds(regions: Region[]): string[] {
  const ids: string[] = [];
  for (const r of regions) {
    for (let round = 0; round < 4; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) ids.push(`${r.name}-${round}-${i}`);
    }
  }
  ids.push("ff-4-0", "ff-4-1", "ff-5-0");
  return ids;
}

const SEED_PAIRS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

/** Build hypothetical results where the higher seed always wins unresolved games */
function chalkFill(regions: Region[], results: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = {};
  const m = () => ({ ...results, ...h });
  for (const r of regions) {
    // Round 0: seeds are known
    for (let i = 0; i < 8; i++) {
      const gid = `${r.name}-0-${i}`;
      if (results[gid]) continue;
      const [sA, sB] = SEED_PAIRS[i];
      h[gid] = toRegionSeed(r.name, Math.min(sA, sB));
    }
    // Rounds 1-3
    for (let round = 1; round < 4; round++) {
      const count = 8 / Math.pow(2, round);
      for (let i = 0; i < count; i++) {
        const gid = `${r.name}-${round}-${i}`;
        if (results[gid]) continue;
        const a = m()[`${r.name}-${round - 1}-${i * 2}`];
        const b = m()[`${r.name}-${round - 1}-${i * 2 + 1}`];
        if (!a || !b) continue;
        const pA = parseRegionSeed(a), pB = parseRegionSeed(b);
        h[gid] = (pA && pB) ? (pA.seed <= pB.seed ? a : b) : a;
      }
    }
  }
  // Final Four
  const ffPairs: [string, string, string][] = regions.length >= 4 ? [
    ["ff-4-0", `${regions[0].name}-3-0`, `${regions[2].name}-3-0`],
    ["ff-4-1", `${regions[1].name}-3-0`, `${regions[3].name}-3-0`],
  ] : [];
  for (const [gid, fA, fB] of ffPairs) {
    if (results[gid]) continue;
    const a = m()[fA], b = m()[fB];
    if (!a || !b) continue;
    const pA = parseRegionSeed(a), pB = parseRegionSeed(b);
    h[gid] = (pA && pB) ? (pA.seed <= pB.seed ? a : b) : a;
  }
  // Championship
  if (!results["ff-5-0"]) {
    const a = m()["ff-4-0"], b = m()["ff-4-1"];
    if (a && b) {
      const pA = parseRegionSeed(a), pB = parseRegionSeed(b);
      h["ff-5-0"] = (pA && pB) ? (pA.seed <= pB.seed ? a : b) : a;
    }
  }
  return h;
}

export default function SimulatePage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, loading: tournLoading } = useTournament();
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState("");
  const [data, setData] = useState<{
    scoring: ScoringSettings;
    bracket: any;
    results: Record<string, string>;
    entries: SimEntry[];
  } | null>(null);
  const [hypo, setHypo] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [picksAnchor, setPicksAnchor] = useState<null | HTMLElement>(null);
  const [lbOpen, setLbOpen] = useState(() => typeof window !== "undefined" ? sessionStorage.getItem("sim-lb-open") !== "0" : true);
  const [mcOpen, setMcOpen] = useState(() => typeof window !== "undefined" ? sessionStorage.getItem("sim-mc-open") !== "0" : true);
  const toggleLb = () => setLbOpen((v) => { sessionStorage.setItem("sim-lb-open", v ? "0" : "1"); return !v; });
  const toggleMc = () => setMcOpen((v) => { sessionStorage.setItem("sim-mc-open", v ? "0" : "1"); return !v; });
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));
  const isMobile = useMediaQuery("(max-width:767px)");
  const isMedium = useMediaQuery("(min-width:768px) and (max-width:1199px)");

  useEffect(() => {
    if (user) api.groups.list().then((d) => setGroups(d.groups));
  }, [user]);

  useEffect(() => {
    if (groupId && tournament) {
      api.simulate.get(groupId, tournament.id).then((d) => {
        setData(d);
      });
    }
  }, [groupId, tournament]);

  const regions: Region[] = data?.bracket?.regions || [];
  const firstFour: FirstFourGame[] | undefined = data?.bracket?.first_four;
  const results = data?.results || {};
  // merged = actual results + hypothetical picks; used as "picks" for the bracket components
  // so teams propagate forward through the bracket correctly
  const merged = useMemo(() => ({ ...results, ...hypo }), [results, hypo]);

  const gameScores = useGameScores(regions, firstFour, results);

  const mcEntries = useMemo(() =>
    (data?.entries || []).map((e) => ({
      key: `${e.username}|${e.bracket_name}`,
      picks: e.picks,
    })),
    [data],
  );

  const { mcResults, progress: mcProgress, running: mcRunning } = useMonteCarlo(
    mcEntries, results, hypo, regions, data?.scoring,
  );

  const baseRanked = useMemo(() => {
    if (!data) return [];
    return data.entries
      .map((e) => ({
        key: `${e.username}|${e.bracket_name}`,
        score: scorePicks(e.picks, results, data.scoring, regions),
      }))
      .sort((a, b) => b.score - a.score);
  }, [data, results, regions]);

  const simRanked = useMemo(() => {
    if (!data) return [];
    return data.entries
      .map((e) => ({
        ...e,
        key: `${e.username}|${e.bracket_name}`,
        score: scorePicks(e.picks, merged, data.scoring, regions),
      }))
      .sort((a, b) => b.score - a.score);
  }, [data, merged, regions]);

  const rankChange = useCallback((key: string) => {
    const baseIdx = baseRanked.findIndex((e) => e.key === key);
    const simIdx = simRanked.findIndex((e) => e.key === key);
    if (baseIdx < 0 || simIdx < 0) return 0;
    return baseIdx - simIdx;
  }, [baseRanked, simRanked]);

  const scoreDelta = useCallback((key: string) => {
    const base = baseRanked.find((e) => e.key === key);
    const sim = simRanked.find((e) => e.key === key);
    if (!base || !sim) return 0;
    return sim.score - base.score;
  }, [baseRanked, simRanked]);

  const pickHypo = useCallback((gameId: string, team: Team) => {
    if (results[gameId]) return; // can't override actual results
    // Compute region-seed for the team
    const parts = gameId.split("-");
    let rs: string;
    if (parts[0] === "ff" && parts[1] === "play") {
      rs = team.name; // FF play-in: store team name
    } else if (parts[0] === "ff") {
      const regionName = getTeamRegion(team.name, regions);
      rs = regionName ? toRegionSeed(regionName, team.seed) : team.name;
    } else {
      rs = toRegionSeed(parts[0], team.seed);
    }
    setHypo((prev) => {
      const next = { ...prev };
      if (next[gameId] === rs) { delete next[gameId]; }
      else { next[gameId] = rs; }
      // Cascade-clear: repeatedly remove hypothetical results whose winner
      // is no longer a valid feeder team (team was eliminated upstream).
      const ids = regions.length ? allGameIds(regions) : [];
      let changed = true;
      while (changed) {
        changed = false;
        const m = { ...results, ...next };
        for (const id of ids) {
          if (id === gameId || !next[id]) continue;
          const p = id.split("-");
          const region = p[0];
          const round = parseInt(p[1]);
          const idx = parseInt(p[2]);
          let feedA: string | undefined, feedB: string | undefined;
          let hasFeeders = false;
          if (region === "ff") {
            if (round === 4 && idx === 0) { feedA = m[`${regions[0].name}-3-0`]; feedB = m[`${regions[2].name}-3-0`]; hasFeeders = true; }
            else if (round === 4 && idx === 1) { feedA = m[`${regions[1].name}-3-0`]; feedB = m[`${regions[3].name}-3-0`]; hasFeeders = true; }
            else if (round === 5) { feedA = m["ff-4-0"]; feedB = m["ff-4-1"]; hasFeeders = true; }
          } else if (round > 0) {
            feedA = m[`${region}-${round - 1}-${idx * 2}`];
            feedB = m[`${region}-${round - 1}-${idx * 2 + 1}`];
            hasFeeders = true;
          }
          if (hasFeeders && next[id] !== feedA && next[id] !== feedB) {
            delete next[id];
            changed = true;
          }
        }
      }
      return next;
    });
  }, [regions, results]);

  // Current user's brackets in this group
  const myBrackets = useMemo(() =>
    (data?.entries || []).filter((e) => e.username === user?.username),
    [data, user],
  );

  const fillChalk = useCallback(() => {
    if (!regions.length) return;
    setHypo(chalkFill(regions, results));
  }, [regions, results]);

  const fillMyPicks = useCallback((entry: SimEntry) => {
    if (!regions.length) return;
    // Only set picks for games not already in actual results
    const h: Record<string, string> = {};
    const ids = allGameIds(regions);
    for (const id of ids) {
      if (!results[id] && entry.picks[id]) h[id] = entry.picks[id];
    }
    setHypo(h);
    setPicksAnchor(null);
  }, [regions, results]);

  const liveCount = useMemo(() => Object.values(gameScores).filter(g => g.state === "in").length, [gameScores]);

  const fillCurrentResults = useCallback(() => {
    if (!regions.length) return;
    // Build name → regionSeed map
    const nameToRS: Record<string, string> = {};
    for (const r of regions) for (const t of r.teams) nameToRS[t.name] = toRegionSeed(r.name, t.seed);
    // Build gameId → [teamAName, teamBName] from the same logic useGameScores uses
    const rsToName: Record<string, string> = {};
    for (const r of regions) for (const t of r.teams) rsToName[toRegionSeed(r.name, t.seed)] = t.name;
    const resolve = (v: string) => rsToName[v] || v;

    setHypo(prev => {
      const next = { ...prev };
      for (const [gid, gs] of Object.entries(gameScores)) {
        if (gs.state !== "in" || results[gid]) continue;
        const scoreA = parseInt(gs.teamA || "0");
        const scoreB = parseInt(gs.teamB || "0");
        if (scoreA === scoreB) continue; // tied — skip
        // Determine which team is teamA/teamB for this game
        // gameScores aligns teamA/teamB with the bracket's team order
        // We need to find the actual team names for this game
        const parts = gid.split("-");
        if (parts[0] === "ff") {
          const round = parseInt(parts[1]);
          const idx = parseInt(parts[2]);
          let feedA: string | undefined, feedB: string | undefined;
          if (round === 4 && idx === 0) { feedA = results[`${regions[0].name}-3-0`]; feedB = results[`${regions[2].name}-3-0`]; }
          else if (round === 4 && idx === 1) { feedA = results[`${regions[1].name}-3-0`]; feedB = results[`${regions[3].name}-3-0`]; }
          else if (round === 5) { feedA = results["ff-4-0"]; feedB = results["ff-4-1"]; }
          const winner = scoreA > scoreB ? feedA : feedB;
          if (winner) next[gid] = winner;
        } else {
          const region = parts[0];
          const round = parseInt(parts[1]);
          const i = parseInt(parts[2]);
          if (round === 0) {
            const pair = SEED_PAIRS[i];
            const winner = scoreA > scoreB ? toRegionSeed(region, pair[0]) : toRegionSeed(region, pair[1]);
            next[gid] = winner;
          } else {
            const feedA = results[`${region}-${round - 1}-${i * 2}`];
            const feedB = results[`${region}-${round - 1}-${i * 2 + 1}`];
            const winner = scoreA > scoreB ? feedA : feedB;
            if (winner) next[gid] = winner;
          }
        }
      }
      return next;
    });
  }, [regions, results, gameScores]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  const locked = isTournamentLocked(tournament?.lock_time ?? null);

  if (!locked && !user.is_admin) {
    return (
      <>
        <Navbar />
        <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>🔮 What-If Simulator</Typography>
          <Typography color="text.secondary">Available after brackets lock.</Typography>
        </Container>
      </>
    );
  }

  const hideMC = !locked && !user.is_admin;

  const hypoCount = Object.keys(hypo).length;

  const leaderboardPanel = data && (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, cursor: "pointer" }} onClick={toggleLb}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Leaderboard {hypoCount > 0 && <Chip label={`${hypoCount} hypothetical`} size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />}
          </Typography>
          <Tooltip title="Shows what the standings would look like if the hypothetical results you selected actually happen." arrow>
            <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} onClick={(e) => e.stopPropagation()} />
          </Tooltip>
          {lbOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>
        {hypoCount > 0 && <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); setHypo({}); }}>Reset</Button>}
      </Box>
      <Collapse in={lbOpen}>
        <TableContainer component={Paper} sx={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1 }}>#</TableCell>
              <TableCell sx={{ py: 0.5, px: 1 }}>Player</TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>Score</TableCell>
              <TableCell align="center" sx={{ py: 0.5, px: 1 }}>Δ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {simRanked.map((e, i) => {
              const delta = rankChange(e.key);
              const rank = i === 0 || e.score !== simRanked[i - 1].score ? i + 1 : simRanked.findIndex((s) => s.score === e.score) + 1;
              const tied = simRanked.filter((s) => s.score === e.score).length > 1;
              return (
                <TableRow key={e.key} sx={{ transition: "background 0.3s", ...(user && e.username === user.username ? { bgcolor: "action.selected" } : {}) }}>
                  <TableCell sx={{ py: 0.25, px: 1 }}>{tied ? `T-${rank}` : rank}</TableCell>
                  <TableCell sx={{ py: 0.25, px: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontSize: "0.75rem", maxWidth: 120 }}>
                      {e.username}{e.bracket_name ? ` — ${e.bracket_name}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.25, px: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{e.score}</Typography>
                      {(() => { const sd = scoreDelta(e.key); return sd !== 0 ? (
                        <Typography variant="caption" sx={{ color: sd > 0 ? "success.main" : "error.main", fontWeight: 600, fontSize: "0.65rem" }}>
                          {sd > 0 ? `+${sd}` : sd}
                        </Typography>
                      ) : null; })()}
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.25, px: 1 }}>
                    {delta > 0 && <Chip icon={<ArrowUpwardIcon sx={{ fontSize: 14 }} />} label={`+${delta}`} size="small" color="success" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.7rem" } }} />}
                    {delta < 0 && <Chip icon={<ArrowDownwardIcon sx={{ fontSize: 14 }} />} label={`${delta}`} size="small" color="error" variant="outlined" sx={{ height: 20, "& .MuiChip-label": { px: 0.5, fontSize: "0.7rem" } }} />}
                    {delta === 0 && <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      </Collapse>
    </Box>
  );

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Box>
            <Typography variant="h5" gutterBottom>🔮 What-If Simulator</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Click teams in undecided games to set hypothetical winners. The leaderboard updates live.
            </Typography>
          </Box>
          {data && !isWide && (
            <IconButton onClick={() => setDrawerOpen(true)} color="primary">
              <LeaderboardIcon />
            </IconButton>
          )}
        </Box>

        <FormControl size="small" sx={{ minWidth: 250, mb: 2 }}>
          <InputLabel>Select Group</InputLabel>
          <Select value={groupId} label="Select Group" onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {data && regions.length > 0 && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Legend */}
              <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "rgba(76,175,80,0.3)", border: "1px solid #4caf50", borderRadius: 0.5 }} />
                  <Typography variant="caption">Actual result</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "rgba(66,165,245,0.3)", border: "1px solid #42a5f5", borderRadius: 0.5 }} />
                  <Typography variant="caption">Hypothetical</Typography>
                </Box>
                {/* Autofill buttons */}
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={fillChalk}>Top Seeds</Button>
                  {liveCount > 0 && (
                    <Button size="small" variant="outlined" color="success" onClick={fillCurrentResults}>
                      📺 If Current Results Hold
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={myBrackets.length === 0}
                    onClick={(e) => myBrackets.length === 1 ? fillMyPicks(myBrackets[0]) : setPicksAnchor(e.currentTarget)}
                  >
                    My Picks
                  </Button>
                  <Menu anchorEl={picksAnchor} open={Boolean(picksAnchor)} onClose={() => setPicksAnchor(null)}>
                    {myBrackets.map((b) => (
                      <MenuItem key={b.bracket_name} onClick={() => fillMyPicks(b)}>
                        {b.bracket_name || "Default"}
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              </Box>

              {isMobile ? (
                <MobileBracket
                  regions={regions} picks={merged} results={results}
                  gameScores={gameScores} onPick={pickHypo} firstFour={firstFour}
                />
              ) : isMedium ? (
                <MediumBracket
                  regions={regions} picks={merged} results={results}
                  gameScores={gameScores} onPick={pickHypo} firstFour={firstFour}
                />
              ) : (
              <>
              {/* Top half: East | Final Four | West */}
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <RegionBracket region={regions[0]} picks={merged} results={results} gameScores={gameScores} onPick={pickHypo} direction="left" firstFour={firstFour} />
                  <FinalFour regions={regions} picks={merged} results={results} gameScores={gameScores} onPick={pickHypo} firstFour={firstFour} />
                  <RegionBracket region={regions[1]} picks={merged} results={results} gameScores={gameScores} onPick={pickHypo} direction="right" firstFour={firstFour} />
                </Box>
              </Box>
              {/* Bottom half: South | spacer | Midwest */}
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <RegionBracket region={regions[2]} picks={merged} results={results} gameScores={gameScores} onPick={pickHypo} direction="left" firstFour={firstFour} />
                  <Box sx={{ minWidth: 160 }} />
                  <RegionBracket region={regions[3]} picks={merged} results={results} gameScores={gameScores} onPick={pickHypo} direction="right" firstFour={firstFour} />
                </Box>
              </Box>
              </>
              )}
            </Box>

            {/* Leaderboard sidebar (wide screens) */}
            {isWide && (
              <Box sx={{ width: 340, flexShrink: 0 }}>
                {leaderboardPanel}
                <Box sx={{ mt: 2 }}>
                  <MonteCarloTable results={mcResults} progress={mcProgress} running={mcRunning} currentUser={user?.username} hidden={hideMC} open={mcOpen} onToggle={toggleMc} />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {data && regions.length === 0 && (
          <Typography color="text.secondary">No bracket data available for this tournament.</Typography>
        )}
      </Container>

      {/* Leaderboard drawer (narrow screens) */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 320, p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="h6">Leaderboard</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}><CloseIcon /></IconButton>
          </Box>
          {leaderboardPanel}
          <Box sx={{ mt: 2 }}>
            <MonteCarloTable results={mcResults} progress={mcProgress} running={mcRunning} currentUser={user?.username} hidden={hideMC} open={mcOpen} onToggle={toggleMc} />
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
