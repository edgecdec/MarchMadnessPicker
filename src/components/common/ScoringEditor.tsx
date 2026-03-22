"use client";
import { useState } from "react";
import { Box, TextField, Typography, Button, Snackbar, Alert } from "@mui/material";
import { ScoringSettings, DEFAULT_SCORING } from "@/types";
import { getRoundName } from "@/lib/scoring";
import { api } from "@/lib/api";

interface Props {
  groupId: string;
  initial: ScoringSettings;
  canEdit: boolean;
}

export default function ScoringEditor({ groupId, initial, canEdit }: Props) {
  const [settings, setSettings] = useState<ScoringSettings>({
    pointsPerRound: [...(initial.pointsPerRound || DEFAULT_SCORING.pointsPerRound)],
    upsetBonusPerRound: [...(initial.upsetBonusPerRound || DEFAULT_SCORING.upsetBonusPerRound)],
  });
  const [snack, setSnack] = useState("");

  const update = (field: "pointsPerRound" | "upsetBonusPerRound", idx: number, val: string) => {
    setSettings((s) => {
      const arr = [...s[field]];
      arr[idx] = Math.min(1000, Math.max(0, parseInt(val) || 0));
      return { ...s, [field]: arr };
    });
  };

  const save = async () => {
    try {
      await api.groups.updateScoring(groupId, settings);
      setSnack("Scoring saved!");
    } catch (e: any) {
      setSnack(e.message);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>Scoring Settings</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 0.5, alignItems: "center", maxWidth: 400 }}>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Round</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Points</Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>Upset Bonus</Typography>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: "contents" }}>
            <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>{getRoundName(i)}</Typography>
            <TextField
              size="small" type="number" value={settings.pointsPerRound[i]}
              onChange={(e) => update("pointsPerRound", i, e.target.value)}
              disabled={!canEdit}
              inputProps={{ min: 0, max: 1000, style: { padding: "4px 8px", fontSize: "0.8rem" } }}
            />
            <TextField
              size="small" type="number" value={settings.upsetBonusPerRound[i]}
              onChange={(e) => update("upsetBonusPerRound", i, e.target.value)}
              disabled={!canEdit}
              inputProps={{ min: 0, max: 1000, style: { padding: "4px 8px", fontSize: "0.8rem" } }}
            />
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
        Upset bonus = multiplier × seed difference (e.g. 9 beats 1 with bonus 2 = 2 × 8 = 16 extra pts)
      </Typography>
      {canEdit && (
        <Button size="small" variant="outlined" onClick={save} sx={{ mt: 1 }}>Save Scoring</Button>
      )}
      <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack("")}>
        <Alert severity="success" onClose={() => setSnack("")}>{snack}</Alert>
      </Snackbar>
    </Box>
  );
}
