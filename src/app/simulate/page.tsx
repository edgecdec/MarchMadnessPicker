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
import RegionBracket from "@/components/bracket/RegionBracket";
import FinalFour from "@/components/bracket/FinalFour";
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
  // merged = actual results + hypothetical picks; used as "picks" for the bracket components
  // so teams propagate forward through the bracket correctly
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

  const pickHypo = useCallback((gameId: string, team: Team) => {
    if (results[gameId]) return; // can't override actual results
    setHypo((prev) => {
      const next = { ...prev };
      if (next[gameId] === team.name) { delete next[gameId]; }
      else { next[gameId] = team.name; }
      // Clear downstream games that depended on a different winner
      const ids = regions.length ? allGameIds(regions) : [];
      for (const id of ids) {
        if (id === gameId || !next[id]) continue;
        const parts = id.split("-");
        const region = parts[0];
        const round = parseInt(parts[1]);
        const idx = parseInt(parts[2]);
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
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Leaderboard {hypoCount > 0 && <Chip label={`${hypoCount} hypothetical`} size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />}
        </Typography>
        {hypoCount > 0 && <Button size="small" variant="outlined" onClick={() => setHypo({})}>Reset</Button>}
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
                  <Box sx={{ width: 12, height: 12, bgcolor: "rgba(255,111,0,0.25)", border: "1px solid #ff6f00", borderRadius: 0.5 }} />
                  <Typography variant="caption">Hypothetical</Typography>
                </Box>
              </Box>

              {/* Top half: East | Final Four | West */}
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <RegionBracket region={regions[0]} picks={merged} results={results} onPick={pickHypo} direction="left" firstFour={firstFour} />
                  <FinalFour regions={regions} picks={merged} results={results} onPick={pickHypo} />
                  <RegionBracket region={regions[1]} picks={merged} results={results} onPick={pickHypo} direction="right" firstFour={firstFour} />
                </Box>
              </Box>
              {/* Bottom half: South | spacer | Midwest */}
              <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                  <RegionBracket region={regions[2]} picks={merged} results={results} onPick={pickHypo} direction="left" firstFour={firstFour} />
                  <Box sx={{ minWidth: 160 }} />
                  <RegionBracket region={regions[3]} picks={merged} results={results} onPick={pickHypo} direction="right" firstFour={firstFour} />
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
