"use client";
import { Box, Typography, Paper } from "@mui/material";
import { useLiveScores } from "@/hooks/useLiveScores";

export default function LiveScores() {
  const games = useLiveScores();

  if (games.length === 0) return null;

  return (
    <Paper className="no-print" sx={{ p: 1.5, mb: 2, bgcolor: "action.hover" }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: "primary.main", mb: 1, display: "block" }}>
        🏀 Live Scores
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 0.5 }}>
        {games.map((g) => (
          <Paper key={g.id} sx={{ p: 1, minWidth: 160, flexShrink: 0, bgcolor: "action.hover" }}>
            <Typography variant="caption" sx={{ fontSize: "0.6rem", color: g.state === "in" ? "success.main" : "text.disabled", display: "block", mb: 0.5 }}>
              {g.state === "in" ? `🔴 ${g.detail}` : g.detail}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>{g.away.name}</Typography>
              <Typography variant="body2" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>{g.away.score || "-"}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>{g.home.name}</Typography>
              <Typography variant="body2" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>{g.home.score || "-"}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}
