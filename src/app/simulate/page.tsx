"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem, FormControl,
  InputLabel, Button, Chip, Drawer, useMediaQuery, useTheme, IconButton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import CloseIcon from "@mui/icons-material/Close";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { scorePicks } from "@/lib/scoring";
import { ScoringSettings, Region, Team, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, REGION_COLORS, getTeamLogoUrl } from "@/lib/bracketData";
import { ffGameId } from "@/components/bracket/FirstFour";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

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

function getTeamForGame(
  region: Region, round: number, gameIndex: number,
  merged: Record<string, string>, firstFour?: FirstFourGame[], results?: Record<string, string>,
): { teamA?: Team; teamB?: Team } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find(t => t.seed === pair[0]);
    let teamB = region.teams.find(t => t.seed === pair[1]);
    if (firstFour) {
      for (const ff of firstFour) {
        if (ff.region !== region.name || ff.slot !== gameIndex) continue;
        const gid = ffGameId(ff);
        const resolved = results?.[gid] || merged[gid];
        const placeholder: Team = { seed: ff.seed, name: resolved || `${ff.teamA}/${ff.teamB}` };
        if (ff.seed === pair[0]) teamA = placeholder; else teamB = placeholder;
      }
    }
    return { teamA, teamB };
  }
  const prevA = merged[`${region.name}-${round - 1}-${gameIndex * 2}`];
  const prevB = merged[`${region.name}-${round - 1}-${gameIndex * 2 + 1}`];
  return {
    teamA: prevA ? region.teams.find(t => t.name === prevA) : undefined,
    teamB: prevB ? region.teams.find(t => t.name === prevB) : undefined,
  };
}

function findTeam(regions: Region[], name: string): Team | undefined {
  for (const r of regions) { const t = r.teams.find(t => t.name === name); if (t) return t; }
}

// Simulator matchup: actual results are locked, undecided games are clickable
function SimMatchup({ teamA, teamB, gameId, merged, results, hypo, onPick, regionColor }: {
  teamA?: Team; teamB?: Team; gameId: string;
  merged: Record<string, string>; results: Record<string, string>;
  hypo: Record<string, string>; onPick: (gameId: string, team: string) => void;
  regionColor?: string;
}) {
  const decided = !!results[gameId];
  const winner = merged[gameId];
  const isHypo = !!hypo[gameId];
  const border = regionColor || "#444";

  return (
    <Box sx={{ my: 0.25 }}>
      {[teamA, teamB].map((team, ti) => {
        const isWinner = !!team && winner === team.name;
        const clickable = !decided && !!team;
        const bg = decided && isWinner
          ? "rgba(76,175,80,0.2)"
          : isHypo && isWinner
          ? "rgba(255,111,0,0.3)"
          : "transparent";

        return (
          <Box
            key={ti}
            onClick={() => clickable && onPick(gameId, team!.name)}
            sx={{
              display: "flex", alignItems: "center", gap: 0.5, px: 0.75,
              py: { xs: 0.75, sm: 0.25 },
              minWidth: 130, minHeight: { xs: 32, sm: "auto" },
              cursor: clickable ? "pointer" : "default",
              background: bg,
              borderTop: ti === 0 ? `1px solid ${border}` : "none",
              borderBottom: `1px solid ${border}`,
              borderLeft: `1px solid ${border}`,
              borderRight: `1px solid ${border}`,
              opacity: decided && !isWinner ? 0.4 : 1,
              "&:hover": clickable ? { background: isWinner ? bg : "rgba(255,255,255,0.08)" } : {},
              transition: "background 0.2s ease",
            }}
          >
            {team ? (<>
              <Typography variant="caption" sx={{ color: "#999", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>{team.seed}</Typography>
              {(() => { const logo = getTeamLogoUrl(team.name); return logo ? <Box component="img" src={logo} alt="" sx={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} /> : null; })()}
              <Typography variant="body2" noWrap sx={{ fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400, flexGrow: 1 }}>{team.name}</Typography>
              {decided && isWinner && <Typography component="span" sx={{ fontSize: "0.6rem", color: "#4caf50" }}>✓</Typography>}
              {isHypo && isWinner && <Typography component="span" sx={{ fontSize: "0.6rem", color: "#ff6f00" }}>?</Typography>}
            </>) : (
              <Typography variant="body2" sx={{ color: "#555", fontSize: "0.7rem", fontStyle: "italic" }}>—</Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function SimRegion({ region, merged, results, hypo, onPick, firstFour, direction }: {
  region: Region; merged: Record<string, string>; results: Record<string, string>;
  hypo: Record<string, string>; onPick: (gameId: string, team: string) => void;
  firstFour?: FirstFourGame[]; direction: "left" | "right";
}) {
  const regionColor = REGION_COLORS[region.name] || "#888";
  const gamesPerRound = [8, 4, 2, 1];

  const renderRound = (round: number) => (
    <Box key={round} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", minWidth: 130, flexShrink: 0 }}>
      {Array.from({ length: gamesPerRound[round] }, (_, i) => {
        const gameId = `${region.name}-${round}-${i}`;
        const { teamA, teamB } = getTeamForGame(region, round, i, merged, firstFour, results);
        return (
          <Box key={gameId} sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <SimMatchup teamA={teamA} teamB={teamB} gameId={gameId} merged={merged} results={results} hypo={hypo} onPick={onPick} regionColor={regionColor} />
          </Box>
        );
      })}
    </Box>
  );

  const rounds = [0, 1, 2, 3];
  const ordered = direction === "left" ? rounds : [...rounds].reverse();

  const renderConnectors = (fromRound: number) => {
    const toCount = gamesPerRound[fromRound] / 2;
    return (
      <Box key={`conn-${fromRound}`} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", width: 16, flexShrink: 0 }}>
        {Array.from({ length: toCount }, (_, i) => (
          <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            <Box sx={{ flex: 1, borderRight: `2px solid ${regionColor}`, borderBottom: direction === "left" ? `2px solid ${regionColor}` : "none", borderTop: direction === "right" ? `2px solid ${regionColor}` : "none" }} />
            <Box sx={{ flex: 1, borderRight: `2px solid ${regionColor}`, borderTop: direction === "left" ? `2px solid ${regionColor}` : "none", borderBottom: direction === "right" ? `2px solid ${regionColor}` : "none" }} />
          </Box>
        ))}
      </Box>
    );
  };

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < ordered.length; i++) {
    elements.push(renderRound(ordered[i]));
    if (i < ordered.length - 1) {
      const fromRound = direction === "left" ? ordered[i] : ordered[i + 1];
      elements.push(renderConnectors(fromRound));
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" align="center" sx={{ mb: 0.5, fontWeight: 700, color: regionColor }}>{region.name}</Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "stretch", minHeight: 400 }}>{elements}</Box>
    </Box>
  );
}

function SimFinalFour({ regions, merged, results, hypo, onPick }: {
  regions: Region[]; merged: Record<string, string>; results: Record<string, string>;
  hypo: Record<string, string>; onPick: (gameId: string, team: string) => void;
}) {
  const eastW = merged[`${regions[0].name}-3-0`];
  const westW = merged[`${regions[1].name}-3-0`];
  const southW = merged[`${regions[2].name}-3-0`];
  const midwestW = merged[`${regions[3].name}-3-0`];

  const champWinner = merged["ff-5-0"];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minWidth: 160 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Final Four</Typography>
      <SimMatchup
        teamA={eastW ? findTeam(regions, eastW) : undefined}
        teamB={westW ? findTeam(regions, westW) : undefined}
        gameId="ff-4-0" merged={merged} results={results} hypo={hypo} onPick={onPick}
      />
      <Box sx={{ my: 1 }}>
        <Typography variant="caption" align="center" display="block" sx={{ fontWeight: 700, color: "primary.main", mb: 0.5 }}>Championship</Typography>
        <SimMatchup
          teamA={merged["ff-4-0"] ? findTeam(regions, merged["ff-4-0"]) : undefined}
          teamB={merged["ff-4-1"] ? findTeam(regions, merged["ff-4-1"]) : undefined}
          gameId="ff-5-0" merged={merged} results={results} hypo={hypo} onPick={onPick}
        />
        {champWinner && (() => {
          const champTeam = findTeam(regions, champWinner);
          const logo = getTeamLogoUrl(champWinner);
          const isHypo = !!hypo["ff-5-0"];
          return (
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, p: 1.5, borderRadius: 2, background: isHypo ? "linear-gradient(135deg, rgba(255,111,0,0.15), rgba(255,111,0,0.25))" : "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,111,0,0.15))", border: isHypo ? "2px dashed rgba(255,111,0,0.5)" : "2px solid rgba(255,215,0,0.5)" }}>
              <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>{isHypo ? "🔮" : "🏆"}</Typography>
              {logo && <Box component="img" src={logo} alt="" sx={{ width: 48, height: 48, objectFit: "contain" }} />}
              <Typography variant="h6" align="center" sx={{ fontWeight: 800, color: isHypo ? "#ff6f00" : "#FFD700", fontSize: "1.1rem", lineHeight: 1.2 }}>
                {champWinner}
              </Typography>
              {champTeam && <Typography variant="caption" sx={{ color: "#aaa", fontSize: "0.7rem" }}>({champTeam.seed}) seed</Typography>}
              <Typography variant="caption" sx={{ color: isHypo ? "#ff6f00" : "#FFD700", fontWeight: 600, fontSize: "0.65rem", letterSpacing: 1, textTransform: "uppercase" }}>
                {isHypo ? "Hypothetical Champion" : "Champion"}
              </Typography>
            </Box>
          );
        })()}
      </Box>
      <SimMatchup
        teamA={southW ? findTeam(regions, southW) : undefined}
        teamB={midwestW ? findTeam(regions, midwestW) : undefined}
        gameId="ff-4-1" merged={merged} results={results} hypo={hypo} onPick={onPick}
      />
    </Box>
  );
}

// Leaderboard panel component
function SimLeaderboard({ simRanked, rankChange, hypoCount, onReset }: {
  simRanked: (SimEntry & { score: number; key: string })[];
  rankChange: (key: string) => number;
  hypoCount: number;
  onReset: () => void;
}) {
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Leaderboard {hypoCount > 0 && <Chip label={`${hypoCount} hypothetical`} size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />}
        </Typography>
        {hypoCount > 0 && <Button size="small" variant="outlined" onClick={onReset}>Reset</Button>}
      </Box>
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
              return (
                <TableRow key={e.key} sx={{ transition: "background 0.3s" }}>
                  <TableCell sx={{ py: 0.25, px: 1 }}>{i + 1}</TableCell>
                  <TableCell sx={{ py: 0.25, px: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontSize: "0.75rem", maxWidth: 120 }}>
                      {e.username}{e.bracket_name ? ` — ${e.bracket_name}` : ""}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.25, px: 1, fontWeight: 700 }}>{e.score}</TableCell>
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
    </Box>
  );
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
  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));

  useEffect(() => {
    if (user) api.groups.list().then((d) => setGroups(d.groups));
  }, [user]);

  useEffect(() => {
    if (groupId && tournament) {
      api.simulate.get(groupId, tournament.id).then((d) => {
        setData(d);
        setHypo({});
      });
    }
  }, [groupId, tournament]);

  const regions: Region[] = data?.bracket?.regions || [];
  const firstFour: FirstFourGame[] | undefined = data?.bracket?.first_four;
  const results = data?.results || {};
  const merged = useMemo(() => ({ ...results, ...hypo }), [results, hypo]);

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

  const pickHypo = useCallback((gameId: string, team: string) => {
    if (results[gameId]) return; // can't override actual results
    setHypo((prev) => {
      const next = { ...prev };
      if (next[gameId] === team) { delete next[gameId]; }
      else { next[gameId] = team; }
      // Clear downstream games that depended on a different winner
      const ids = regions.length ? allGameIds(regions) : [];
      for (const id of ids) {
        if (id === gameId || !next[id]) continue;
        const parts = id.split("-");
        const region = parts[0];
        const round = parseInt(parts[1]);
        const idx = parseInt(parts[2]);
        // Check if this game's teams still exist in merged state
        const m = { ...results, ...next };
        let feedA: string | undefined, feedB: string | undefined;
        if (region === "ff") {
          if (round === 4 && idx === 0) { feedA = m[`${regions[0].name}-3-0`]; feedB = m[`${regions[1].name}-3-0`]; }
          else if (round === 4 && idx === 1) { feedA = m[`${regions[2].name}-3-0`]; feedB = m[`${regions[3].name}-3-0`]; }
          else if (round === 5) { feedA = m["ff-4-0"]; feedB = m["ff-4-1"]; }
        } else if (round > 0) {
          feedA = m[`${region}-${round - 1}-${idx * 2}`];
          feedB = m[`${region}-${round - 1}-${idx * 2 + 1}`];
        }
        if (feedA !== undefined && feedB !== undefined && next[id] !== feedA && next[id] !== feedB) {
          delete next[id];
        }
      }
      return next;
    });
  }, [regions, results]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  const hypoCount = Object.keys(hypo).length;

  const leaderboardPanel = data && (
    <SimLeaderboard simRanked={simRanked} rankChange={rankChange} hypoCount={hypoCount} onReset={() => setHypo({})} />
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
            {/* Bracket area */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Legend */}
              <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap", alignItems: "center" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "rgba(76,175,80,0.3)", border: "1px solid #4caf50", borderRadius: 0.5 }} />
                  <Typography variant="caption">Actual result</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: "rgba(255,111,0,0.3)", border: "1px solid #ff6f00", borderRadius: 0.5 }} />
                  <Typography variant="caption">Hypothetical</Typography>
                </Box>
              </Box>

              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <SimRegion region={regions[0]} merged={merged} results={results} hypo={hypo} onPick={pickHypo} firstFour={firstFour} direction="left" />
                  <SimFinalFour regions={regions} merged={merged} results={results} hypo={hypo} onPick={pickHypo} />
                  <SimRegion region={regions[1]} merged={merged} results={results} hypo={hypo} onPick={pickHypo} firstFour={firstFour} direction="right" />
                </Box>
              </Box>
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <SimRegion region={regions[2]} merged={merged} results={results} hypo={hypo} onPick={pickHypo} firstFour={firstFour} direction="left" />
                  <Box sx={{ minWidth: 160 }} />
                  <SimRegion region={regions[3]} merged={merged} results={results} hypo={hypo} onPick={pickHypo} firstFour={firstFour} direction="right" />
                </Box>
              </Box>
            </Box>

            {/* Leaderboard sidebar (wide screens) */}
            {isWide && (
              <Box sx={{ width: 340, flexShrink: 0 }}>
                {leaderboardPanel}
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
        </Box>
      </Drawer>
    </>
  );
}
