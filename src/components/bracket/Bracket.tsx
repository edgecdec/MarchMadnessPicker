"use client";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Box, Button, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from "@mui/material";
import RegionBracket from "./RegionBracket";
import FinalFour from "./FinalFour";
import FirstFour from "./FirstFour";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { scorePicks, maxPossibleScore, getEliminatedTeams } from "@/lib/scoring";
import { TOTAL_GAMES } from "@/lib/bracketData";
import { autofillBracket } from "@/lib/autofill";

interface Props {
  regions: Region[];
  firstFour?: FirstFourGame[];
  initialPicks?: Record<string, string>;
  results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  tournamentId?: string;
  locked?: boolean;
  distribution?: Record<string, Record<string, number>>;
  bracketName?: string;
  initialTiebreaker?: number | null;
  onSaved?: () => void;
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

  // First Four picks: cascade into the R64 slot and beyond
  if (parts[0] === "ff" && parts[1] === "play") {
    const ffRegion = parts[2];
    const ffSlot = parseInt(parts[4]);
    // Clear R64 slot and all downstream in that region
    for (let r = 0; r <= 3; r++) {
      const gamesInRound = 8 / Math.pow(2, r);
      for (let i = 0; i < gamesInRound; i++) {
        const gid = `${ffRegion}-${r}-${i}`;
        if (updated[gid] === oldWinner) delete updated[gid];
      }
    }
    for (const gid of ["ff-4-0", "ff-4-1", "ff-5-0"]) {
      if (updated[gid] === oldWinner) delete updated[gid];
    }
    return updated;
  }

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

export default function Bracket({ regions, firstFour, initialPicks, results, gameScores, tournamentId, locked, distribution, bracketName, initialTiebreaker, onSaved }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks || {});
  const [tiebreaker, setTiebreaker] = useState<string>(initialTiebreaker != null ? String(initialTiebreaker) : "");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const savedPicksRef = useRef<string>(JSON.stringify(initialPicks || {}));

  // Warn on unsaved changes when leaving page
  const isDirty = !locked && JSON.stringify(picks) !== savedPicksRef.current;
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Calculate score
  const score = results ? scorePicks(picks, results) : 0;
  const maxPoss = results ? maxPossibleScore(results) : 0;
  const eliminated = useMemo(() => results ? getEliminatedTeams(results, regions) : new Set<string>(), [results, regions]);

  const handleExport = async () => {
    if (!bracketRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      // Force dark text for readable export on white background
      bracketRef.current.classList.add("bracket-export");
      const canvas = await html2canvas(bracketRef.current, { backgroundColor: "#ffffff", scale: 2, scrollX: 0, scrollY: 0, windowWidth: bracketRef.current.scrollWidth });
      bracketRef.current.classList.remove("bracket-export");
      const link = document.createElement("a");
      link.download = "bracket.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      bracketRef.current?.classList.remove("bracket-export");
      setSnack({ msg: "Failed to export bracket", severity: "error" });
    }
    setExporting(false);
  };

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
        body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks, bracket_name: bracketName, tiebreaker: tiebreaker ? Number(tiebreaker) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      savedPicksRef.current = JSON.stringify(picks);
      setSnack({ msg: "Picks saved!", severity: "success" });
      onSaved?.();
    } catch (e: any) {
      setSnack({ msg: e.message || "Failed to save", severity: "error" });
    }
    setSaving(false);
  };

  const handleReset = async () => {
    setResetOpen(false);
    if (!tournamentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, picks_data: {}, bracket_name: bracketName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPicks({});
      savedPicksRef.current = JSON.stringify({});
      setSnack({ msg: "Picks cleared!", severity: "success" });
    } catch (e: any) {
      setSnack({ msg: e.message || "Failed to clear picks", severity: "error" });
    }
    setSaving(false);
  };

  const validGameIds = useMemo(() => {
    const ids = new Set<string>();
    for (const r of regions) {
      for (let round = 0; round <= 3; round++) {
        for (let i = 0; i < 8 / Math.pow(2, round); i++) ids.add(`${r.name}-${round}-${i}`);
      }
    }
    ids.add("ff-4-0"); ids.add("ff-4-1"); ids.add("ff-5-0");
    return ids;
  }, [regions]);
  const totalPicks = Object.keys(picks).filter(k => validGameIds.has(k)).length;
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
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" size="small" onClick={() => setPicks(autofillBracket(regions, "chalk", firstFour, picks))} disabled={saving}>
              🏅 Chalk
            </Button>
            <Button variant="outlined" size="small" onClick={() => setPicks(autofillBracket(regions, "smart", firstFour, picks))} disabled={saving}>
              🧠 Smart
            </Button>
            <Button variant="outlined" size="small" onClick={() => setPicks(autofillBracket(regions, "random", firstFour, picks))} disabled={saving}>
              🎲 Random
            </Button>
            <Button variant="outlined" size="small" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "📷 Export"}
            </Button>
            <Button variant="outlined" color="error" onClick={() => setResetOpen(true)} disabled={saving || totalPicks === 0} size="small">
              Reset Picks
            </Button>
            <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={saving} size="small">
              {saving ? "Saving..." : "Save Picks"}
            </Button>
            {isDirty && <Typography variant="body2" color="warning.main">⚠ Unsaved changes</Typography>}
          </Box>
        )}
        {locked && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="outlined" size="small" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "📷 Export"}
            </Button>
            <Typography variant="body2" color="warning.main">🔒 Picks are locked</Typography>
          </Box>
        )}
      </Box>

      {/* Tiebreaker question */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Tiebreaker: Predict the total combined score of the Championship Game
        </Typography>
        <TextField
          type="number"
          size="small"
          value={tiebreaker}
          onChange={(e) => !locked && setTiebreaker(e.target.value)}
          disabled={locked}
          placeholder="e.g. 145"
          inputProps={{ min: 0, max: 500, "aria-label": "Tiebreaker score prediction" }}
          sx={{ width: 120 }}
        />
      </Box>

      {/* First Four play-in games */}
      {firstFour && firstFour.length > 0 && (
        <FirstFour games={firstFour} picks={picks} results={results} onPick={handlePick} locked={locked} />
      )}

      {/* Top half: East (left-to-right) | Final Four | West (right-to-left) */}
      <Box ref={bracketRef}>
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[0]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
          <FinalFour regions={regions} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} distribution={distribution} eliminated={eliminated} />
          <RegionBracket region={regions[1]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
        </Box>
      </Box>

      {/* Bottom half: South (left-to-right) | spacer | Midwest (right-to-left) */}
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[2]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
          <Box sx={{ minWidth: 160 }} /> {/* spacer to match Final Four width */}
          <RegionBracket region={regions[3]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
        </Box>
      </Box>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Save Picks</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>Review your key picks before saving:</DialogContentText>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Typography variant="subtitle2">🏆 Final Four</Typography>
            {regions.map((r) => {
              const winner = picks[`${r.name}-3-0`];
              return (
                <Typography key={r.name} variant="body2" sx={{ pl: 2 }}>
                  {r.name}: {winner || "—"}
                </Typography>
              );
            })}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>🥇 Champion</Typography>
            <Typography variant="body2" sx={{ pl: 2, fontWeight: 700 }}>
              {picks["ff-5-0"] || "— (not picked)"}
            </Typography>
            {tiebreaker && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>🎯 Tiebreaker</Typography>
                <Typography variant="body2" sx={{ pl: 2 }}>{tiebreaker} points</Typography>
              </>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {totalPicks}/{totalGames} picks made
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={() => { setConfirmOpen(false); handleSave(); }} variant="contained">Save Picks</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)}>
        <DialogTitle>Reset All Picks?</DialogTitle>
        <DialogContent>
          <DialogContentText>This will clear all {totalPicks} picks and save immediately. This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error">Reset</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
