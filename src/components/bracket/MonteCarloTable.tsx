"use client";
import { useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, LinearProgress, TableSortLabel,
} from "@mui/material";
import { MCResult } from "@/hooks/useMonteCarlo";

type SortKey = "winPct" | "avgPlace" | "avgScore";

export default function MonteCarloTable({
  results, progress, running, currentUser, hidden,
}: {
  results: MCResult[];
  progress: number;
  running: boolean;
  currentUser?: string;
  hidden?: boolean;
}) {
  const [sortBy, setSortBy] = useState<SortKey>("winPct");
  const [asc, setAsc] = useState(false);

  const sorted = [...results].sort((a, b) => {
    const dir = asc ? 1 : -1;
    const diff = sortBy === "avgPlace" ? a[sortBy] - b[sortBy] : a[sortBy] - b[sortBy];
    return (diff * dir) || b.winPct - a.winPct || a.avgPlace - b.avgPlace || b.avgScore - a.avgScore;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setAsc(!asc);
    else { setSortBy(key); setAsc(key === "avgPlace"); }
  };

  if (hidden) {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
          🎲 Monte Carlo
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Simulation results available after brackets lock.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
        🎲 Monte Carlo ({running ? `${progress}/1000` : "1000 sims"})
      </Typography>
      {running && <LinearProgress variant="determinate" value={progress / 10} sx={{ mb: 1 }} />}
      {results.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5, px: 1, width: "40%" }}>Player</TableCell>
                {(["avgScore", "avgPlace", "winPct"] as SortKey[]).map((k) => (
                  <TableCell key={k} align="right" sx={{ py: 0.5, px: 1, width: "20%" }}>
                    <TableSortLabel
                      active={sortBy === k}
                      direction={sortBy === k ? (asc ? "asc" : "desc") : "desc"}
                      onClick={() => handleSort(k)}
                    >
                      {k === "avgScore" ? "Avg Score" : k === "avgPlace" ? "Avg Place" : "Win %"}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((r) => {
                const isMe = currentUser && r.key.startsWith(currentUser + "|");
                return (
                  <TableRow key={r.key} sx={isMe ? { bgcolor: "action.selected" } : undefined}>
                    <TableCell sx={{ py: 0.25, px: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.key.replace("|", " — ").replace(" — null", "")}>
                      <Typography variant="body2" noWrap sx={{ fontSize: "0.75rem" }}>
                        {r.key.replace("|", " — ").replace(" — null", "")}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.25, px: 1 }}>{r.avgScore.toFixed(1)}</TableCell>
                    <TableCell align="right" sx={{ py: 0.25, px: 1 }}>{r.avgPlace.toFixed(1)}</TableCell>
                    <TableCell align="right" sx={{ py: 0.25, px: 1, fontWeight: 700 }}>{r.winPct.toFixed(1)}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
