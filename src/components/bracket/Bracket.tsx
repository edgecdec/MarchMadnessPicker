"use client";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Box, Button, Typography, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, Menu, MenuItem, Tooltip, useMediaQuery } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import RegionBracket from "./RegionBracket";
import FinalFour from "./FinalFour";
import MobileBracket from "./MobileBracket";
import SimpleMode from "./SimpleMode";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { scorePicks, maxPossibleScore, getEliminatedTeams } from "@/lib/scoring";
import { toRegionSeed, TOTAL_GAMES, getTeamRegion, resolveRegionSeed, getTeamLogoUrl, parseRegionSeed } from "@/lib/bracketData";
import { autofillBracket } from "@/lib/autofill";
import { cascadeClear } from "@/lib/bracketUtils";
import TeamLogo from "@/components/common/TeamLogo";

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
  initialVersion?: number;
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

export default function Bracket({ regions, firstFour, initialPicks, results, gameScores, tournamentId, locked, distribution, bracketName, initialTiebreaker, initialVersion, onSaved }: Props) {
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks || {});
  const [tiebreaker, setTiebreaker] = useState<string>(initialTiebreaker != null ? String(initialTiebreaker) : "");
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bracketRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [autofillAnchor, setAutofillAnchor] = useState<null | HTMLElement>(null);
  const [simpleModeOpen, setSimpleModeOpen] = useState(false);
  const savedPicksRef = useRef<string>(JSON.stringify(initialPicks || {}));
  const savedTiebreakerRef = useRef<string>(initialTiebreaker != null ? String(initialTiebreaker) : "");
  const versionRef = useRef<number>(initialVersion ?? 1);
  const [versionConflict, setVersionConflict] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved" | "idle">("idle");
  const isMobile = useMediaQuery("(max-width:767px)");

  // Sync internal state when switching brackets
  useEffect(() => {
    setPicks(initialPicks || {});
    savedPicksRef.current = JSON.stringify(initialPicks || {});
    versionRef.current = initialVersion ?? 1;
    setVersionConflict(false);
  }, [initialPicks, bracketName, initialVersion]);

  useEffect(() => {
    setTiebreaker(initialTiebreaker != null ? String(initialTiebreaker) : "");
    savedTiebreakerRef.current = initialTiebreaker != null ? String(initialTiebreaker) : "";
  }, [initialTiebreaker, bracketName]);

  // Dynamic print scaling: measure bracket and fit to landscape page
  useEffect(() => {
    const beforePrint = () => {
      const el = bracketRef.current;
      if (!el) return;
      // Landscape printable area: ~10in wide × ~7.5in tall at 96dpi, minus margins
      const pageW = 9.5 * 96; // ~912px
      const pageH = 7.0 * 96; // ~672px
      const scaleX = pageW / el.scrollWidth;
      const scaleY = pageH / el.scrollHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      el.style.transform = `scale(${scale})`;
      el.style.width = `${100 / scale}%`;
    };
    const afterPrint = () => {
      const el = bracketRef.current;
      if (!el) return;
      el.style.transform = "";
      el.style.width = "";
    };
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => { window.removeEventListener("beforeprint", beforePrint); window.removeEventListener("afterprint", afterPrint); };
  }, []);

  // Warn on unsaved changes when leaving page
  const isDirty = !locked && (JSON.stringify(picks) !== savedPicksRef.current || tiebreaker !== savedTiebreakerRef.current);
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  // Autosave with 2-second debounce
  useEffect(() => {
    if (locked || !tournamentId || versionConflict) return;
    const picksJson = JSON.stringify(picks);
    if (picksJson === savedPicksRef.current && tiebreaker === savedTiebreakerRef.current) return;
    // Don't autosave empty brackets (no picks made yet)
    if (Object.keys(picks).length === 0 && !tiebreaker) return;
    setAutoSaveStatus("unsaved");
    const timer = setTimeout(async () => {
      setAutoSaveStatus("saving");
      try {
        const res = await fetch("/api/picks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks, bracket_name: bracketName, tiebreaker: tiebreaker ? Number(tiebreaker) : null, version: versionRef.current }),
        });
        if (res.status === 409) {
          setVersionConflict(true);
          setAutoSaveStatus("unsaved");
          return;
        }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (data.version) versionRef.current = data.version;
        savedPicksRef.current = picksJson;
        savedTiebreakerRef.current = tiebreaker;
        setAutoSaveStatus("saved");
        onSavedRef.current?.();
      } catch {
        setAutoSaveStatus("unsaved");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [picks, tiebreaker, locked, tournamentId, bracketName, versionConflict]);

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
        // Determine region-seed identifier for this team
        const parts = gameId.split("-");
        let regionSeed: string;
        if (parts[0] === "ff") {
          // Final Four / Championship: team's region-seed was propagated from earlier picks
          // Find the team's region from bracket data
          const regionName = getTeamRegion(team.name, regions);
          regionSeed = regionName ? toRegionSeed(regionName, team.seed) : team.name;
        } else {
          // Regional game: region is in the gameId
          regionSeed = toRegionSeed(parts[0], team.seed);
        }

        const oldWinner = updated[gameId];
        if (oldWinner === regionSeed) return prev; // same pick, no-op

        // If changing a pick, cascade-clear downstream
        if (oldWinner) {
          updated = cascadeClear(updated, gameId, oldWinner);
        }
        updated[gameId] = regionSeed;
        return updated;
      });
    },
    [locked, regions]
  );

  const handleSave = async () => {
    if (!tournamentId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks, bracket_name: bracketName, tiebreaker: tiebreaker ? Number(tiebreaker) : null, version: versionRef.current }),
      });
      const data = await res.json();
      if (res.status === 409) { setVersionConflict(true); setSaving(false); return; }
      if (!res.ok) throw new Error(data.error);
      if (data.version) versionRef.current = data.version;
      savedPicksRef.current = JSON.stringify(picks);
      savedTiebreakerRef.current = tiebreaker;
      setAutoSaveStatus("saved");
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
        body: JSON.stringify({ tournament_id: tournamentId, picks_data: {}, bracket_name: bracketName, version: versionRef.current }),
      });
      const data = await res.json();
      if (res.status === 409) { setVersionConflict(true); setSaving(false); return; }
      if (!res.ok) throw new Error(data.error);
      if (data.version) versionRef.current = data.version;
      setPicks({});
      savedPicksRef.current = JSON.stringify({});
      setAutoSaveStatus("idle");
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
      <Box className="no-print" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
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
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="outlined" size="small" onClick={(e) => setAutofillAnchor(e.currentTarget)} disabled={saving}>
              🪄 Autofill
            </Button>
            <Menu anchorEl={autofillAnchor} open={Boolean(autofillAnchor)} onClose={() => setAutofillAnchor(null)}>
              <Tooltip title="Uses historical NCAA tournament win rates to probabilistically fill remaining picks" placement="right">
                <MenuItem onClick={() => { setPicks(autofillBracket(regions, "smart", firstFour, picks)); setAutofillAnchor(null); }}>🧠 Smart</MenuItem>
              </Tooltip>
              <Tooltip title="Randomly picks a winner for each remaining unfilled game" placement="right">
                <MenuItem onClick={() => { setPicks(autofillBracket(regions, "random", firstFour, picks)); setAutofillAnchor(null); }}>🎲 Random</MenuItem>
              </Tooltip>
              <Tooltip title="Picks the higher seed (favorite) for every remaining unfilled game" placement="right">
                <MenuItem onClick={() => { setPicks(autofillBracket(regions, "chalk", firstFour, picks)); setAutofillAnchor(null); }}>🏅 Chalk</MenuItem>
              </Tooltip>
            </Menu>
            {totalPicks < totalGames && (
              <Button variant="outlined" size="small" onClick={() => setSimpleModeOpen(true)} disabled={saving}>
                📋 Fill Step-by-Step
              </Button>
            )}
            <Button variant="outlined" size="small" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "📷 Export"}
            </Button>
            <Button variant="outlined" size="small" onClick={() => window.print()} startIcon={<PrintIcon />}>
              Print
            </Button>
            <Button variant="outlined" color="error" onClick={() => setResetOpen(true)} disabled={saving || totalPicks === 0} size="small">
              Reset Picks
            </Button>
            <Button variant="contained" onClick={() => setConfirmOpen(true)} disabled={saving} size="small">
              {saving ? "Saving..." : "Save Picks"}
            </Button>
            {autoSaveStatus === "saved" && <Typography variant="body2" color="success.main">✓ Saved</Typography>}
            {autoSaveStatus === "saving" && <Typography variant="body2" color="text.secondary">Saving...</Typography>}
            {autoSaveStatus === "unsaved" && <Typography variant="body2" color="warning.main">⚠ Unsaved</Typography>}
          </Box>
        )}
        {locked && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="outlined" size="small" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "📷 Export"}
            </Button>
            <Button variant="outlined" size="small" onClick={() => window.print()} startIcon={<PrintIcon />}>
              Print
            </Button>
            <Typography variant="body2" color="warning.main">🔒 Picks are locked</Typography>
          </Box>
        )}
      </Box>

      {/* Tiebreaker question + Champion display */}
      <Box className="no-print" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {picks["ff-5-0"] && (() => {
          const champName = resolveRegionSeed(picks["ff-5-0"], regions, firstFour, results);
          const logo = getTeamLogoUrl(champName);
          const parsed = parseRegionSeed(picks["ff-5-0"]);
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Typography sx={{ fontSize: "1rem", lineHeight: 1 }}>🏆</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "warning.main" }}>Champion:</Typography>
              {logo && <TeamLogo src={logo} size={20} />}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {champName}{parsed ? ` (${parsed.seed})` : ""}
              </Typography>
            </Box>
          );
        })()}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
      </Box>

      {/* Bracket grid: mobile tabs or desktop layout */}
      <Box ref={bracketRef} className="bracket-print-container" sx={{ mx: "auto", width: "fit-content", maxWidth: "100%", position: "relative" }}>
      {isMobile ? (
        <MobileBracket
          regions={regions} picks={picks} results={results}
          gameScores={gameScores} onPick={handlePick} locked={locked}
          distribution={distribution} eliminated={eliminated} firstFour={firstFour}
        />
      ) : (
      <>
      {/* Top half: East | spacer | West */}
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[0]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
          <Box sx={{ minWidth: 160 }} />
          <RegionBracket region={regions[1]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
        </Box>
      </Box>

      {/* Bottom half: South | spacer | Midwest */}
      <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", overflow: "hidden" }}>
        <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
          <RegionBracket region={regions[2]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="left" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
          <Box sx={{ minWidth: 160 }} />
          <RegionBracket region={regions[3]} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} direction="right" distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
        </Box>
      </Box>

      {/* Final Four: absolutely positioned to overlap the seam between top and bottom panes */}
      <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10, bgcolor: "background.paper", borderRadius: 3, p: 1 }}>
        <FinalFour regions={regions} picks={picks} results={results} gameScores={gameScores} onPick={handlePick} locked={locked} distribution={distribution} eliminated={eliminated} firstFour={firstFour} />
      </Box>
      </>
      )}
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
                  {r.name}: {winner ? resolveRegionSeed(winner, regions, firstFour, results) : "—"}
                </Typography>
              );
            })}
            <Typography variant="subtitle2" sx={{ mt: 1 }}>🥇 Champion</Typography>
            <Typography variant="body2" sx={{ pl: 2, fontWeight: 700 }}>
              {picks["ff-5-0"] ? resolveRegionSeed(picks["ff-5-0"], regions, firstFour, results) : "— (not picked)"}
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

      <Dialog open={versionConflict}>
        <DialogTitle>Bracket Modified</DialogTitle>
        <DialogContent>
          <DialogContentText>This bracket was modified in another tab. Reload to get the latest version.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => window.location.reload()} variant="contained">Reload</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>

      <SimpleMode
        open={simpleModeOpen}
        onClose={() => setSimpleModeOpen(false)}
        regions={regions}
        firstFour={firstFour}
        picks={picks}
        onPicksChange={setPicks}
        results={results}
        locked={locked}
        tiebreaker={tiebreaker}
        onTiebreakerChange={setTiebreaker}
        onSave={async () => { await handleSave(); return true; }}
      />
    </Box>
  );
}
