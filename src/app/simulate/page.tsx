"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem, FormControl,
  InputLabel, Button, Chip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { scorePicks } from "@/lib/scoring";
import { ScoringSettings, Region } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";
import { getRoundName } from "@/lib/scoring";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

interface SimEntry {
  username: string;
  bracket_name: string | null;
  picks: Record<string, string>;
  tiebreaker: number | null;
}

// Generate all 63 game IDs from regions
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

// Get the two teams that could play in a game
function getGameTeams(
  gameId: string,
  regions: Region[],
  results: Record<string, string>,
  hypo: Record<string, string>,
): [string | null, string | null] {
  const merged = { ...results, ...hypo };
  const [region, roundStr, idxStr] = gameId.split("-");
  const round = parseInt(roundStr);
  const idx = parseInt(idxStr);

  if (round === 0 && region !== "ff") {
    const reg = regions.find((r) => r.name === region);
    if (!reg) return [null, null];
    const pair = SEED_ORDER_PAIRS[idx];
    const a = reg.teams.find((t) => t.seed === pair[0]);
    const b = reg.teams.find((t) => t.seed === pair[1]);
    return [a?.name || null, b?.name || null];
  }

  if (region === "ff") {
    if (round === 4 && idx === 0) {
      return [merged[`${regions[0].name}-3-0`] || null, merged[`${regions[1].name}-3-0`] || null];
    }
    if (round === 4 && idx === 1) {
      return [merged[`${regions[2].name}-3-0`] || null, merged[`${regions[3].name}-3-0`] || null];
    }
    if (round === 5) {
      return [merged["ff-4-0"] || null, merged["ff-4-1"] || null];
    }
  }

  // Later region rounds
  const a = merged[`${region}-${round - 1}-${idx * 2}`] || null;
  const b = merged[`${region}-${round - 1}-${idx * 2 + 1}`] || null;
  return [a, b];
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
  const results = data?.results || {};
  const merged = useMemo(() => ({ ...results, ...hypo }), [results, hypo]);

  // Compute base scores (actual results only) for rank change arrows
  const baseRanked = useMemo(() => {
    if (!data) return [];
    return data.entries
      .map((e) => ({
        key: `${e.username}|${e.bracket_name}`,
        score: scorePicks(e.picks, results, data.scoring, regions),
      }))
      .sort((a, b) => b.score - a.score);
  }, [data, results, regions]);

  // Compute simulated scores (actual + hypothetical)
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

  // Remaining (undecided) games where both teams are known
  const remainingGames = useMemo(() => {
    if (!regions.length) return [];
    return allGameIds(regions).filter((id) => {
      if (results[id] || hypo[id]) return false;
      const [a, b] = getGameTeams(id, regions, results, hypo);
      return a && b;
    });
  }, [regions, results, hypo]);

  const pickHypo = useCallback((gameId: string, team: string) => {
    setHypo((prev) => {
      const next = { ...prev };
      // If clicking same team, toggle off
      if (next[gameId] === team) { delete next[gameId]; }
      else { next[gameId] = team; }
      // Clear downstream games that depended on a different winner
      const ids = regions.length ? allGameIds(regions) : [];
      for (const id of ids) {
        if (id === gameId || !next[id]) continue;
        const [a, b] = getGameTeams(id, regions, results, next);
        if (next[id] !== a && next[id] !== b) delete next[id];
      }
      return next;
    });
  }, [regions, results]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  const rankChange = (key: string) => {
    const baseIdx = baseRanked.findIndex((e) => e.key === key);
    const simIdx = simRanked.findIndex((e) => e.key === key);
    if (baseIdx < 0 || simIdx < 0) return 0;
    return baseIdx - simIdx; // positive = moved up
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>🔮 What-If Simulator</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pick hypothetical winners for remaining games and see how the leaderboard changes.
        </Typography>

        <FormControl size="small" sx={{ minWidth: 250, mb: 3 }}>
          <InputLabel>Select Group</InputLabel>
          <Select value={groupId} label="Select Group" onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {data && (
          <>
            {/* Simulated Leaderboard */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Player</TableCell>
                    <TableCell>Bracket</TableCell>
                    <TableCell align="right">Score</TableCell>
                    <TableCell align="center">Change</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simRanked.map((e, i) => {
                    const delta = rankChange(e.key);
                    return (
                      <TableRow key={e.key}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>{e.username}</TableCell>
                        <TableCell>{e.bracket_name || "—"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>{e.score}</TableCell>
                        <TableCell align="center">
                          {delta > 0 && <Chip icon={<ArrowUpwardIcon />} label={`+${delta}`} size="small" color="success" variant="outlined" />}
                          {delta < 0 && <Chip icon={<ArrowDownwardIcon />} label={`${delta}`} size="small" color="error" variant="outlined" />}
                          {delta === 0 && "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Remaining Games */}
            {remainingGames.length > 0 && (
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">Remaining Games ({remainingGames.length})</Typography>
                  {Object.keys(hypo).length > 0 && (
                    <Button size="small" variant="outlined" onClick={() => setHypo({})}>Reset</Button>
                  )}
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {remainingGames.map((gameId) => {
                    const [a, b] = getGameTeams(gameId, regions, results, hypo);
                    const parts = gameId.split("-");
                    const round = parseInt(parts[1]);
                    return (
                      <Paper key={gameId} variant="outlined" sx={{ p: 1, minWidth: 180 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                          {parts[0] === "ff" ? "Final Four" : parts[0]} · {getRoundName(round)}
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                          {[a, b].map((team) => team && (
                            <Chip
                              key={team}
                              label={team}
                              size="small"
                              variant={hypo[gameId] === team ? "filled" : "outlined"}
                              color={hypo[gameId] === team ? "primary" : "default"}
                              onClick={() => pickHypo(gameId, team)}
                              sx={{ cursor: "pointer", justifyContent: "flex-start" }}
                            />
                          ))}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              </Paper>
            )}

            {remainingGames.length === 0 && Object.keys(results).length > 0 && (
              <Typography color="text.secondary">All games have been decided — no remaining games to simulate.</Typography>
            )}
          </>
        )}
      </Container>
    </>
  );
}
