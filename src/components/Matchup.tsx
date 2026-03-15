"use client";
import { Box, Typography, Paper } from "@mui/material";
import { Team } from "@/lib/bracketData";

interface Props {
  teamA?: Team;
  teamB?: Team;
  winner?: string;
  result?: string; // actual result for scoring
  onPick: (team: Team) => void;
  locked?: boolean;
  compact?: boolean;
}

function TeamSlot({
  team,
  isWinner,
  isCorrect,
  isWrong,
  onClick,
  locked,
  position,
}: {
  team?: Team;
  isWinner: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  onClick: () => void;
  locked?: boolean;
  position: "top" | "bottom";
}) {
  const bg = isCorrect
    ? "rgba(76, 175, 80, 0.3)"
    : isWrong
    ? "rgba(244, 67, 54, 0.3)"
    : isWinner
    ? "rgba(255, 111, 0, 0.25)"
    : "transparent";

  return (
    <Box
      onClick={() => !locked && team && onClick()}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: 0.25,
        cursor: locked || !team ? "default" : "pointer",
        background: bg,
        borderTop: position === "top" ? "1px solid #444" : "none",
        borderBottom: "1px solid #444",
        borderLeft: "1px solid #444",
        borderRight: "1px solid #444",
        minWidth: 120,
        "&:hover": !locked && team ? { background: isWinner ? bg : "rgba(255,255,255,0.08)" } : {},
        transition: "background 0.15s",
      }}
    >
      {team ? (
        <>
          <Typography variant="caption" sx={{ color: "#999", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>
            {team.seed}
          </Typography>
          <Typography
            variant="body2"
            noWrap
            sx={{ fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400, flexGrow: 1 }}
          >
            {team.name}
          </Typography>
        </>
      ) : (
        <Typography variant="body2" sx={{ color: "#555", fontSize: "0.7rem", fontStyle: "italic" }}>
          —
        </Typography>
      )}
    </Box>
  );
}

export default function Matchup({ teamA, teamB, winner, result, onPick, locked, compact }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        background: "transparent",
        borderRadius: 0,
        my: compact ? 0 : 0.25,
      }}
    >
      <TeamSlot
        team={teamA}
        isWinner={!!teamA && winner === teamA.name}
        isCorrect={!!result && !!teamA && winner === teamA.name && result === teamA.name}
        isWrong={!!result && !!teamA && winner === teamA.name && result !== teamA.name}
        onClick={() => teamA && onPick(teamA)}
        locked={locked}
        position="top"
      />
      <TeamSlot
        team={teamB}
        isWinner={!!teamB && winner === teamB.name}
        isCorrect={!!result && !!teamB && winner === teamB.name && result === teamB.name}
        isWrong={!!result && !!teamB && winner === teamB.name && result !== teamB.name}
        onClick={() => teamB && onPick(teamB)}
        locked={locked}
        position="bottom"
      />
    </Paper>
  );
}
