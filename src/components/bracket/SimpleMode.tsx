"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Box, IconButton, Typography, LinearProgress, Button, Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Region, Team, FirstFourGame } from "@/types";
import { buildGameOrder, cascadeClear } from "@/lib/bracketUtils";
import { SEED_ORDER_PAIRS, REGION_COLORS, getTeamLogoUrl, toRegionSeed, parseRegionSeed, ffGameId } from "@/lib/bracketData";

interface SimpleModeProps {
  open: boolean;
  onClose: () => void;
  regions: Region[];
  firstFour?: FirstFourGame[];
  picks: Record<string, string>;
  onPicksChange: (picks: Record<string, string>) => void;
  results?: Record<string, string>;
  locked?: boolean;
}

function resolveTeamsForGame(
  gameId: string,
  regions: Region[],
  picks: Record<string, string>,
  results?: Record<string, string>,
  firstFour?: FirstFourGame[],
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
  const regionColor = REGION_COLORS[regionName];

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
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 3, borderRadius: 2, border: 2, borderColor: "divider", borderStyle: "dashed", opacity: 0.4 }}>
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
        p: 3,
        borderRadius: 2,
        border: 3,
        borderColor: selected ? accent : "divider",
        bgcolor: selected ? (theme => theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)") : "background.paper",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": { borderColor: accent, transform: "scale(1.02)" },
        "&:active": { transform: "scale(0.98)" },
        ...(selected && {
          boxShadow: (theme) => `0 0 12px ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
        }),
      }}
    >
      {logo && <Box component="img" src={logo} alt="" sx={{ width: 64, height: 64, objectFit: "contain" }} />}
      <Typography variant="caption" sx={{ color: accent, fontWeight: 700, fontSize: "0.85rem" }}>
        #{team.seed}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
        {team.name}
      </Typography>
    </Box>
  );
}

export default function SimpleMode({ open, onClose, regions, firstFour, picks, onPicksChange, results, locked }: SimpleModeProps) {
  const gameOrder = useMemo(() => buildGameOrder(regions), [regions]);
  const [currentStep, setCurrentStep] = useState(() => {
    const order = buildGameOrder(regions);
    const idx = order.findIndex((gid) => !picks[gid] && !results?.[gid]);
    return idx >= 0 ? idx : 0;
  });
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (advanceTimer.current) clearTimeout(advanceTimer.current); };
  }, []);

  const totalGames = gameOrder.length;
  const pickedCount = gameOrder.filter((gid) => picks[gid] || results?.[gid]).length;
  const currentGameId = gameOrder[currentStep] ?? "";

  const { teamA, teamB, regionColor } = useMemo(
    () => resolveTeamsForGame(currentGameId, regions, picks, results, firstFour),
    [currentGameId, regions, picks, results, firstFour],
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

  const goNext = useCallback(() => {
    for (let i = currentStep + 1; i < totalGames; i++) {
      if (!picks[gameOrder[i]] && !results?.[gameOrder[i]]) {
        setCurrentStep(i);
        setSelectedTeam(null);
        return;
      }
    }
  }, [currentStep, totalGames, gameOrder, picks, results]);

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

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{ color: REGION_COLORS[gameLabel.region] || "text.secondary", fontWeight: 600 }}>
              {gameLabel.region} — {gameLabel.round}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Game {currentStep + 1} of {totalGames} · {pickedCount} picked
            </Typography>
          </Box>
          <IconButton onClick={onClose} edge="end" aria-label="Exit Simple Mode">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Progress bar */}
        <LinearProgress variant="determinate" value={(pickedCount / totalGames) * 100} sx={{ flexShrink: 0 }} />

        {/* Matchup card */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: 2, sm: 4 } }}>
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
        </Box>

        {/* Bottom navigation */}
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1.5, borderTop: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Button onClick={goBack} disabled={currentStep === 0}>
            ← Back
          </Button>
          <Button onClick={goNext} disabled={currentStep >= totalGames - 1}>
            Skip →
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
