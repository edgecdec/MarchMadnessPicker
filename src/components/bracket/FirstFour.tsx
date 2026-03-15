"use client";
import { Box, Typography, Paper } from "@mui/material";
import { FirstFourGame, Team } from "@/types";
import { getTeamLogoUrl, REGION_COLORS } from "@/lib/bracketData";

interface Props {
  games: FirstFourGame[];
  picks: Record<string, string>;
  results?: Record<string, string>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean;
}

function ffGameId(game: FirstFourGame): string {
  return `ff-play-${game.region}-${game.seed}-${game.slot}`;
}

export { ffGameId };

export default function FirstFour({ games, picks, results, onPick, locked }: Props) {
  if (!games.length) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        🏀 First Four
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {games.map((g) => {
          const gid = ffGameId(g);
          const winner = picks[gid];
          const result = results?.[gid];
          const regionColor = REGION_COLORS[g.region] || "#888";

          return (
            <Paper key={gid} variant="outlined" sx={{ p: 1, minWidth: 160, borderColor: regionColor }}>
              <Typography variant="caption" sx={{ color: regionColor, fontWeight: 700, fontSize: "0.6rem" }}>
                {g.region} • {g.seed}-seed play-in
              </Typography>
              {[g.teamA, g.teamB].map((name) => {
                const logo = getTeamLogoUrl(name);
                const isWinner = winner === name;
                const isCorrect = result && winner === name && result === name;
                const isWrong = result && winner === name && result !== name;
                const bg = isCorrect ? "rgba(76,175,80,0.3)" : isWrong ? "rgba(244,67,54,0.3)" : isWinner ? "rgba(255,111,0,0.25)" : "transparent";

                return (
                  <Box
                    key={name}
                    onClick={() => !locked && onPick(gid, { seed: g.seed, name })}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.25,
                      cursor: locked ? "default" : "pointer", background: bg,
                      border: `1px solid ${regionColor}`, borderTop: "none",
                      "&:first-of-type": { borderTop: `1px solid ${regionColor}` },
                      "&:hover": !locked ? { background: isWinner ? bg : "rgba(255,255,255,0.08)" } : {},
                    }}
                  >
                    <Typography variant="caption" sx={{ color: "#999", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>
                      {g.seed}
                    </Typography>
                    {logo && <Box component="img" src={logo} alt="" sx={{ width: 16, height: 16, objectFit: "contain" }} />}
                    <Typography variant="body2" noWrap sx={{ fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400 }}>
                      {name}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
