"use client";
import { useState, useMemo, useCallback } from "react";
import { Box, IconButton, Typography, LinearProgress, Button, Dialog } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Region, FirstFourGame } from "@/types";
import { buildGameOrder, cascadeClear } from "@/lib/bracketUtils";

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

export default function SimpleMode({ open, onClose, regions, picks, onPicksChange, results, locked }: SimpleModeProps) {
  const gameOrder = useMemo(() => buildGameOrder(regions), [regions]);
  const [currentStep, setCurrentStep] = useState(() => {
    // Start at the first unpicked game
    const order = buildGameOrder(regions);
    const idx = order.findIndex((gid) => !picks[gid] && !results?.[gid]);
    return idx >= 0 ? idx : 0;
  });

  const totalGames = gameOrder.length;
  const pickedCount = gameOrder.filter((gid) => picks[gid] || results?.[gid]).length;
  const currentGameId = gameOrder[currentStep] ?? "";

  // Parse game ID for display labels
  const gameLabel = useMemo(() => {
    const parts = currentGameId.split("-");
    if (parts[0] === "ff") {
      const round = parseInt(parts[1]);
      return { region: "Final Four", round: round === 5 ? "Championship" : "Final Four" };
    }
    const roundNames = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8"];
    return { region: parts[0], round: roundNames[parseInt(parts[1])] ?? "" };
  }, [currentGameId]);

  const goBack = useCallback(() => {
    for (let i = currentStep - 1; i >= 0; i--) {
      if (picks[gameOrder[i]] || results?.[gameOrder[i]]) {
        setCurrentStep(i);
        return;
      }
    }
  }, [currentStep, gameOrder, picks, results]);

  const goNext = useCallback(() => {
    for (let i = currentStep + 1; i < totalGames; i++) {
      if (!picks[gameOrder[i]] && !results?.[gameOrder[i]]) {
        setCurrentStep(i);
        return;
      }
    }
  }, [currentStep, totalGames, gameOrder, picks, results]);

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "background.default" }}>
        {/* Top bar */}
        <Box sx={{ display: "flex", alignItems: "center", px: 2, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
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

        {/* Main content area — matchup card will go here in step 4 */}
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
          <Typography color="text.secondary">
            Matchup card for {currentGameId}
          </Typography>
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
