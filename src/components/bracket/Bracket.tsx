"use client";
import { useState, useCallback } from "react";
import { Box, Button, Typography, Snackbar, Alert } from "@mui/material";
import RegionBracket from "./RegionBracket";
import FinalFour from "./FinalFour";
import { Team, Region, GameScore } from "@/types";
import { scorePicks, maxPossibleScore } from "@/lib/scoring";
import { TOTAL_GAMES } from "@/lib/bracketData";

interface Props {
  regions: Region[];
  initialPicks?: Record<string, string>;
  results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  tournamentId?: string;
  locked?: boolean;
}

// Given a game id, return the downstream game id that this winner feeds into
function getNextGameId(gameId: string): string | null {
  const parts = gameId.split("-");
  const region = parts[0];
  const round = parseInt(parts[1]);
  const idx = parseInt(parts[2]);

  if (region === "ff") {
    if (round === 4) return "ff-5-0";
    return null; // championship has no next
  }
  if (round < 3) {
    return `${region}-${round + 1}-${Math.floor(idx / 2)}`;
  }
  // Elite 8 winners go to Final Four
  // East(0) & West(1) -> ff-4-0, South(2) & Midwest(3) -> ff-4-1
  return null; // handled by FinalFour component reading region-3-0 picks
}

// Clear all downstream picks that depend on a team that was just un-picked
function cascadeClear(picks: Record<string, string>, gameId: string, oldWinner: string): Record<string, string> {
  const updated = { ...picks };
  const parts = gameId.split("-");
  const region = parts[0];
  const round = parseInt(parts[1]);
  const idx = parseInt(parts[2]);

  // Clear in subsequent rounds within the region
  for (let r = round + 1; r <= 3; r++) {
    const gamesInRound = 8 / Math.pow(2, r);
    for (let i = 0; i < gamesInRound; i++) {
      const gid = `${region}-${r}-${i}`;
      if (updated[gid] === oldWinner) delete updated[gid];
    }
  }

  // Clear Final Four and Championship if affected
  for (const gid of ["ff-4-0", "ff-4-1", "ff-5-0"]) {
    if (updated[gid] === oldWinner) delete updated[gid];
  }

  return updated;
}

export default function Bracket({ regions, initialPicks, results, gameScores, tournamentId, locked }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks || {});
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  // Calculate score
  const score = results ? scorePicks(picks, results) : 0;
  const maxPoss = results ? maxPossibleScore(results) : 0;

  const handlePick = useCallback(
    (gameId: string, team: Team) => {
      if (locked) return;
      setPicks((prev) => {
        let updated = { ...prev };
        const oldWinner = updated[gameId];
        if (oldWinner === team.name) return prev; // same pick, no-op

        // If changing a pick, cascade-clear downstream
        if (oldWinner) {
          updated = cascadeClear(updated, gameId, oldWinner);
        }
        updated[gameId] = team.name;
        return updated;
      });
    },
    [locked]
  );

  const handleSave = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSnack({ msg: "Picks saved!", severity: "success" });
    } catch (e: any) {
      setSnack({ msg: e.message || "Failed to save", severity: "error" });
    }
    setSaving(false);
  };

  const totalPicks = Object.keys(picks).length;
  const totalGames = TOTAL_GAMES;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {totalPicks}/{totalGames} picks made
          </Typography>
          {results && Object.keys(results).length > 0 && (
            <Typography variant="body1" sx={{ fontWeight: 700, color: "primary.main" }}>
              🏆 Score: {score} / {maxPoss} possible
            </Typography>
          )}
        </Box>
        {!locked && tournamentId && (
          <Button variant="contained" onClick={handleSave} disabled={saving} size="small">
            {saving ? "Saving..." : "Save Picks"}
          </Button>
        )}
        {locked && (
          <Typography variant="body2" color="warning.main">🔒 Picks are locked</Typography>
        )}
      </Box>

      {/* Top half: East (left-to-right) | Final Four | West (right-to-left) */}
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[0]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" />
          <FinalFour regions={regions} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} />
          <RegionBracket region={regions[1]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" />
        </Box>
      </Box>

      {/* Bottom half: South (left-to-right) | spacer | Midwest (right-to-left) */}
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[2]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" />
          <Box sx={{ minWidth: 160 }} /> {/* spacer to match Final Four width */}
          <RegionBracket region={regions[3]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" />
        </Box>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
