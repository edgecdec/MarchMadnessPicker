"use client";
import { useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, LinearProgress, TableSortLabel, Collapse, Tooltip, IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { MCResult } from "@/hooks/useMonteCarlo";

type SortKey = "winPct" | "avgPlace" | "avgScore";

export default function MonteCarloTable({
  results, progress, running, currentUser, hidden, open, onToggle,
}: {
  results: MCResult[];
  progress: number;
  running: boolean;
  currentUser?: string;
  hidden?: boolean;
  open?: boolean;
  onToggle?: () => void;
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

  const collapsible = open !== undefined && onToggle;

  return (
    <Box>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5, ...(collapsible ? { cursor: "pointer" } : {}) }}
        onClick={collapsible ? onToggle : undefined}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          🎲 Monte Carlo ({running ? `${progress}/10000` : "10000 sims"})
        </Typography>
        <Tooltip title="We simulate the rest of the tournament 10,000 times using historical odds to estimate each bracket's chance of winning." arrow>
          <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} />
        </Tooltip>
        {collapsible && (open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />)}
      </Box>
      {running && <LinearProgress variant="determinate" value={progress / 100} sx={{ mb: 1 }} />}
      <Collapse in={open ?? true}>
        {results.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ tableLayout: "fixed", width: "100%" }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5, px: 1, width: "34%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Player</TableCell>
                {(["avgScore", "avgPlace", "winPct"] as SortKey[]).map((k) => (
                  <TableCell key={k} align="right" sx={{ py: 0.5, px: 1, width: "22%" }}>
                    <TableSortLabel
                      active={sortBy === k}
                      direction={sortBy === k ? (asc ? "asc" : "desc") : "desc"}
                      onClick={() => handleSort(k)}
                    >
                      {k === "avgScore" ? "Avg Pts" : k === "avgPlace" ? "Avg Pl" : "Win %"}
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
      </Collapse>
    </Box>
  );
}
