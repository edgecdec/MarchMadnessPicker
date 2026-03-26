"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Box, IconButton, Typography, LinearProgress, Button, Dialog, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import MiniBracket from "./MiniBracket";
import { Region, Team, FirstFourGame } from "@/types";
import { buildGameOrder, cascadeClear } from "@/lib/bracketUtils";
import { SEED_ORDER_PAIRS, getRegionColor, getTeamLogoUrl, toRegionSeed, parseRegionSeed, ffGameId } from "@/lib/bracketData";
import TeamLogo from "@/components/common/TeamLogo";
import { useThemeMode } from "@/hooks/useThemeMode";

interface SimpleModeProps {
  open: boolean;
  onClose: () => void;
  regions: Region[];
  firstFour?: FirstFourGame[];
  picks: Record<string, string>;
  onPicksChange: (picks: Record<string, string>) => void;
  results?: Record<string, string>;
  locked?: boolean;
  tiebreaker?: string;
  onTiebreakerChange?: (value: string) => void;
  onSave?: () => Promise<boolean>;
}

function resolveTeamsForGame(
  gameId: string,
  regions: Region[],
  picks: Record<string, string>,
  results?: Record<string, string>,
  firstFour?: FirstFourGame[],
  mode: "dark" | "light" = "dark",
): { teamA?: Team; teamB?: Team; regionColor?: string } {
  const parts = gameId.split("-");

  if (parts[0] === "ff") {
    // Final Four / Championship
    const round = parseInt(parts[1]);
    const game = parseInt(parts[2]);
    let pickA: string | undefined, pickB: string | undefined;
    if (round === 5) {
      // Championship: winners of ff-4-0 and ff-4-1
      pickA = picks["ff-4-0"];
      pickB = picks["ff-4-1"];
    } else {
      // FF: winners of E8 from paired regions (0+2, 1+3)
      const rA = game === 0 ? regions[0] : regions[1];
      const rB = game === 0 ? regions[2] : regions[3];
      pickA = picks[`${rA.name}-3-0`];
      pickB = picks[`${rB.name}-3-0`];
    }
    const findTeam = (rs?: string): Team | undefined => {
      if (!rs) return undefined;
      const parsed = parseRegionSeed(rs);
      if (parsed) {
        const region = regions.find(r => r.name === parsed.region);
        if (region) {
          if (firstFour) {
            const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
            if (ff) {
              const resolved = results?.[ffGameId(ff)];
              return { seed: parsed.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: rs };
            }
          }
          const t = region.teams.find(t => t.seed === parsed.seed);
          if (t) return { ...t, regionSeed: rs };
        }
      }
      for (const r of regions) {
        const t = r.teams.find(t => t.name === rs);
        if (t) return { ...t, regionSeed: toRegionSeed(r.name, t.seed) };
      }
      return undefined;
    };
    return { teamA: findTeam(pickA), teamB: findTeam(pickB) };
  }

  // Region game
  const regionName = parts[0];
  const round = parseInt(parts[1]);
  const gameIndex = parseInt(parts[2]);
  const region = regions.find(r => r.name === regionName);
  if (!region) return {};
  const regionColor = getRegionColor(regionName, mode);

  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find(t => t.seed === pair[0]);
    let teamB = region.teams.find(t => t.seed === pair[1]);
    if (teamA) teamA = { ...teamA, regionSeed: toRegionSeed(regionName, teamA.seed) };
    if (teamB) teamB = { ...teamB, regionSeed: toRegionSeed(regionName, teamB.seed) };
    if (firstFour) {
      for (const ff of firstFour) {
        if (ff.region !== regionName || (ff.seed !== pair[0] && ff.seed !== pair[1])) continue;
        const gid = ffGameId(ff);
        const resolved = results?.[gid];
        const placeholder: Team = { seed: ff.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: toRegionSeed(regionName, ff.seed) };
        if (ff.seed === pair[0]) teamA = placeholder; else teamB = placeholder;
      }
    }
    return { teamA, teamB, regionColor };
  }

  // Later rounds: resolve from picks
  const prevA = picks[`${regionName}-${round - 1}-${gameIndex * 2}`];
  const prevB = picks[`${regionName}-${round - 1}-${gameIndex * 2 + 1}`];
  const resolveTeam = (rs: string): Team | undefined => {
    const parsed = parseRegionSeed(rs);
    if (parsed) {
      if (firstFour) {
        const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
        if (ff) {
          const resolved = results?.[ffGameId(ff)];
          return { seed: parsed.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: rs };
        }
      }
      const t = region.teams.find(t => t.seed === parsed.seed);
      if (t) return { ...t, regionSeed: rs };
    }
    const direct = region.teams.find(t => t.name === rs);
    if (direct) return { ...direct, regionSeed: toRegionSeed(regionName, direct.seed) };
    return undefined;
  };
  return {
    teamA: prevA ? resolveTeam(prevA) : undefined,
    teamB: prevB ? resolveTeam(prevB) : undefined,
    regionColor,
  };
}

function TeamCard({
  team,
  selected,
  regionColor,
  onClick,
}: {
  team?: Team;
  selected: boolean;
  regionColor?: string;
  onClick: () => void;
}) {
  if (!team) {
    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 3 }, minHeight: { xs: 120, sm: "auto" }, borderRadius: 2, border: 2, borderColor: "divider", borderStyle: "dashed", opacity: 0.4 }}>
        <Typography color="text.disabled">Waiting for earlier pick</Typography>
      </Box>
    );
  }

  const logo = getTeamLogoUrl(team.name);
  const accent = regionColor || "primary.main";

  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        p: { xs: 2, sm: 3 },
        minHeight: { xs: 120, sm: "auto" },
        borderRadius: 2,
        border: 3,
        borderColor: selected ? accent : "divider",
        bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)") : "background.paper",
        cursor: "pointer",
        transition: "all 0.2s ease",
        WebkitTapHighlightColor: "transparent",
        "&:hover": { borderColor: accent, transform: "scale(1.02)" },
        "&:active": { transform: "scale(0.98)" },
        ...(selected && {
          boxShadow: (theme) => `0 0 12px ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
        }),
      }}
    >
      {logo && <TeamLogo src={logo} size={48} sx={{ width: { xs: 48, sm: 64 }, height: { xs: 48, sm: 64 }, p: "4px" }} />}
      <Typography variant="caption" sx={{ color: accent, fontWeight: 700, fontSize: "0.85rem" }}>
        #{team.seed}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center", lineHeight: 1.2, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
        {team.name}
      </Typography>
    </Box>
  );
}

export default function SimpleMode({ open, onClose, regions, firstFour, picks, onPicksChange, results, locked, tiebreaker, onTiebreakerChange, onSave }: SimpleModeProps) {
  const { mode } = useThemeMode();
  const gameOrder = useMemo(() => buildGameOrder(regions), [regions]);
  const [currentStep, setCurrentStep] = useState(() => {
    const order = buildGameOrder(regions);
    const idx = order.findIndex((gid) => !picks[gid] && !results?.[gid]);
    return idx >= 0 ? idx : 0;
  });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saving, setSaving] = useState(false);
  const [showMini, setShowMini] = useState(false);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const totalGames = gameOrder.length;
  const pickedCount = gameOrder.filter((gid) => picks[gid] || results?.[gid]).length;
  const allPicked = pickedCount === totalGames;
  const [showTiebreaker, setShowTiebreaker] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (allPicked) setShowTiebreaker(true);
  }, [allPicked]);

  const currentGameId = gameOrder[currentStep] ?? "";

  const { teamA, teamB, regionColor } = useMemo(
    () => resolveTeamsForGame(currentGameId, regions, picks, results, firstFour, mode),
    [currentGameId, regions, picks, results, firstFour, mode],
  );

  const winner = picks[currentGameId] || results?.[currentGameId];

  const gameLabel = useMemo(() => {
    const parts = currentGameId.split("-");
    if (parts[0] === "ff") {
      const round = parseInt(parts[1]);
      return { region: "Final Four", round: round === 5 ? "Championship" : "Final Four" };
    }
    const roundNames: Record<number, string> = { 0: "Round of 64", 1: "Round of 32", 2: "Sweet 16", 3: "Elite 8" };
    return { region: parts[0], round: roundNames[parseInt(parts[1])] ?? "" };
  }, [currentGameId]);

  const goBack = useCallback(() => {
    for (let i = currentStep - 1; i >= 0; i--) {
      if (picks[gameOrder[i]] || results?.[gameOrder[i]]) {
        setCurrentStep(i);
        setSelectedTeam(null);
        return;
      }
    }
  }, [currentStep, gameOrder, picks, results]);

  const isResolvable = useCallback((gid: string) => {
    const { teamA, teamB } = resolveTeamsForGame(gid, regions, picks, results, firstFour, mode);
    return !!teamA && !!teamB;
  }, [regions, picks, results, firstFour]);

  const goNext = useCallback(() => {
    for (let i = currentStep + 1; i < totalGames; i++) {
      if (!picks[gameOrder[i]] && !results?.[gameOrder[i]] && isResolvable(gameOrder[i])) {
        setCurrentStep(i);
        setSelectedTeam(null);
        return;
      }
    }
  }, [currentStep, totalGames, gameOrder, picks, results, isResolvable]);

  const hasResolvableNext = useMemo(() => {
    for (let i = currentStep + 1; i < totalGames; i++) {
      if (!picks[gameOrder[i]] && !results?.[gameOrder[i]] && isResolvable(gameOrder[i])) return true;
    }
    return false;
  }, [currentStep, totalGames, gameOrder, picks, results, isResolvable]);

  const handlePick = useCallback((team: Team) => {
    if (locked || results?.[currentGameId]) return;
    const pickValue = team.regionSeed || team.name;
    setSelectedTeam(pickValue);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      const oldWinner = picks[currentGameId];
      let newPicks = { ...picks, [currentGameId]: pickValue };
      // If changing a previous pick, cascade clear downstream
      if (oldWinner && oldWinner !== pickValue) {
        newPicks = cascadeClear(newPicks, currentGameId, oldWinner);
        newPicks[currentGameId] = pickValue;
      }
      onPicksChange(newPicks);
      setSelectedTeam(null);
      // Jump to first unpicked game (globally, not just forward)
      const firstUnpicked = gameOrder.findIndex((gid) => !newPicks[gid] && !results?.[gid]);
      if (firstUnpicked >= 0) {
        setCurrentStep(firstUnpicked);
      }
    }, 300);
  }, [locked, results, currentGameId, picks, onPicksChange, gameOrder]);

  const teamMatch = (team: Team | undefined, value?: string | null) => {
    if (!team || !value) return false;
    return (team.regionSeed && team.regionSeed === value) || team.name === value;
  };

  const currentBlocked = !teamA || !teamB;

  const resolveName = useCallback((rs: string): { name: string; seed: number; region?: string } => {
    const parsed = parseRegionSeed(rs);
    if (parsed) {
      const region = regions.find(r => r.name === parsed.region);
      const team = region?.teams.find(t => t.seed === parsed.seed);
      return { name: team?.name || rs, seed: parsed.seed, region: parsed.region };
    }
    return { name: rs, seed: 0 };
  }, [regions]);

  const reviewData = useMemo(() => {
    const regionWinners = regions.map(r => {
      const pick = picks[`${r.name}-3-0`];
      return { region: r.name, ...(pick ? resolveName(pick) : { name: "—", seed: 0 }) };
    });
    const ff0 = picks["ff-4-0"];
    const ff1 = picks["ff-4-1"];
    const champ = picks["ff-5-0"];
    return {
      regionWinners,
      ffWinners: [ff0 ? resolveName(ff0) : null, ff1 ? resolveName(ff1) : null],
      champion: champ ? resolveName(champ) : null,
    };
  }, [regions, picks, resolveName]);

  const handleSaveBracket = useCallback(async () => {
    if (!onSave) return;
    setSaving(true);
    const ok = await onSave();
    setSaving(false);
    if (ok) onClose();
  }, [onSave, onClose]);

  const activeView = showReview ? "review" : showTiebreaker ? "tiebreaker" : "game";

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", alignItems: "center", px: { xs: 1.5, sm: 2 }, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ flex: 1 }}>
            {activeView === "review" ? (
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                Review Your Bracket
              </Typography>
            ) : activeView === "tiebreaker" ? (
              <Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
                Tiebreaker
              </Typography>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: getRegionColor(gameLabel.region, mode), fontWeight: 600 }}>
                  {gameLabel.region} — {gameLabel.round}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Game {currentStep + 1} of {totalGames} · {pickedCount} picked
                </Typography>
              </>
            )}
          </Box>
          <IconButton onClick={onClose} edge="end" aria-label="Exit Simple Mode">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Progress bar */}
        <LinearProgress variant="determinate" value={(pickedCount / totalGames) * 100} sx={{ flexShrink: 0 }} />

        {/* Content */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 4 }, overflow: "auto" }}>
          {activeView === "review" ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, maxWidth: 480, width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>🏆 Bracket Summary</Typography>
              {/* Region winners */}
              <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
                {reviewData.regionWinners.map(rw => (
                  <Box key={rw.region} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.5, borderRadius: 1, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getRegionColor(rw.region!, mode), flexShrink: 0 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70 }}>{rw.region}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>
                      {rw.seed ? `(${rw.seed}) ` : ""}{rw.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {/* Final Four + Champion */}
              <Box sx={{ width: "100%", p: 2, borderRadius: 2, bgcolor: "background.paper", border: 2, borderColor: "primary.main", textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary">Champion</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {reviewData.champion ? `(${reviewData.champion.seed}) ${reviewData.champion.name}` : "—"}
                </Typography>
              </Box>
              {tiebreaker && (
                <Typography variant="body2" color="text.secondary">
                  Tiebreaker: {tiebreaker} points
                </Typography>
              )}
            </Box>
          ) : activeView === "tiebreaker" ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, maxWidth: 400, width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center" }}>
                🏆 All 63 games picked!
              </Typography>
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                Predict the total combined score of the Championship game.
              </Typography>
              <TextField
                type="number"
                label="Total combined score"
                value={tiebreaker ?? ""}
                onChange={(e) => onTiebreakerChange?.(e.target.value)}
                inputProps={{ min: 0, max: 500, "aria-label": "Tiebreaker score prediction" }}
                sx={{ width: "100%", maxWidth: 240 }}
                disabled={locked}
              />
              <Typography variant="caption" color="text.secondary">
                This is used to break ties on the leaderboard.
              </Typography>
            </Box>
          ) : currentBlocked && !hasResolvableNext ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", maxWidth: 400 }}>
              Some games can&apos;t be shown yet because earlier matchups are unanswered. Go back to fill them in.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, width: "100%", maxWidth: 600 }}>
              <TeamCard
                team={teamA}
                selected={teamMatch(teamA, selectedTeam || winner)}
                regionColor={regionColor}
                onClick={() => teamA && handlePick(teamA)}
              />
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 700 }}>VS</Typography>
              </Box>
              <TeamCard
                team={teamB}
                selected={teamMatch(teamB, selectedTeam || winner)}
                regionColor={regionColor}
                onClick={() => teamB && handlePick(teamB)}
              />
            </Box>
          )}
        </Box>

        {/* Mini bracket preview */}
        {activeView === "game" && (
          <Box sx={{ position: "relative" }}>
            {showMini && (
              <Box sx={{ position: "absolute", bottom: 4, right: 8, zIndex: 10, p: 1, borderRadius: 1, bgcolor: "background.paper", boxShadow: 3, border: 1, borderColor: "divider" }}>
                <MiniBracket regions={regions} picks={picks} results={results} firstFour={firstFour} />
              </Box>
            )}
          </Box>
        )}

        {/* Bottom navigation */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 }, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          {activeView === "review" ? (
            <>
              <Button onClick={() => setShowReview(false)} sx={{ minHeight: 44 }}>
                ← Back
              </Button>
              <Button variant="contained" onClick={handleSaveBracket} disabled={saving || !onSave} sx={{ minHeight: 44 }}>
                {saving ? "Saving…" : "Save Bracket"}
              </Button>
            </>
          ) : activeView === "tiebreaker" ? (
            <>
              <Button onClick={() => setShowTiebreaker(false)} sx={{ minHeight: 44 }}>
                ← Back
              </Button>
              <Button variant="contained" onClick={() => setShowReview(true)} sx={{ minHeight: 44 }}>
                Review →
              </Button>
            </>
          ) : (
            <>
              <Button onClick={goBack} disabled={currentStep === 0} sx={{ minHeight: 44 }}>
                ← Back
              </Button>
              <IconButton onClick={() => setShowMini(v => !v)} aria-label="Toggle mini bracket preview" sx={{ color: showMini ? "primary.main" : "text.secondary", display: { xs: "none", sm: "inline-flex" } }}>
                <AccountTreeIcon fontSize="small" />
              </IconButton>
              <Button onClick={goNext} disabled={!hasResolvableNext} sx={{ minHeight: 44 }}>
                Skip →
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
