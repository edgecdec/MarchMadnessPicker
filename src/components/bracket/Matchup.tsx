"use client";
import { Box, Typography, Paper } from "@mui/material";
import { Team, GameScore } from "@/types";

interface Props {
  teamA?: Team;
  teamB?: Team;
  winner?: string;
  result?: string;
  gameScore?: GameScore;
  onPick: (team: Team) => void;
  locked?: boolean;
  compact?: boolean;
}

function TeamSlot({
  team,
  isWinner,
  isCorrect,
  isWrong,
  score,
  isLive,
  onClick,
  locked,
  position,
}: {
  team?: Team;
  isWinner: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
  score?: string;
  isLive?: boolean;
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
        py: { xs: 0.75, sm: 0.25 },
        cursor: locked || !team ? "default" : "pointer",
        background: bg,
        borderTop: position === "top" ? "1px solid #444" : "none",
        borderBottom: "1px solid #444",
        borderLeft: "1px solid #444",
        borderRight: "1px solid #444",
        minWidth: 120,
        minHeight: { xs: 32, sm: "auto" },
        "&:hover": !locked && team ? { background: isWinner ? bg : "rgba(255,255,255,0.08)" } : {},
        transition: "background 0.15s",
      }}
    >
      {team ? (
        <>
          <Typography variant="caption" sx={{ color: "#999", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>
            {team.seed}
          </Typography>
          <Typography variant="body2" noWrap sx={{ fontSize: "0.7rem", fontWeight: isWinner ? 700 : 400, flexGrow: 1 }}>
            {team.name}
          </Typography>
          {score && (
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: "0.65rem", color: isLive ? "#4caf50" : "#aaa", ml: 0.5 }}>
              {score}
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body2" sx={{ color: "#555", fontSize: "0.7rem", fontStyle: "italic" }}>—</Typography>
      )}
    </Box>
  );
}

export default function Matchup({ teamA, teamB, winner, result, gameScore, onPick, locked, compact }: Props) {
  const isLive = gameScore?.state === "in";

  return (
    <Paper elevation={0} sx={{ background: "transparent", borderRadius: 0, my: compact ? 0 : 0.25 }}>
      {gameScore?.detail && (
        <Typography variant="caption" sx={{ fontSize: "0.55rem", color: isLive ? "#4caf50" : "#666", display: "block", textAlign: "center" }}>
          {isLive ? `🔴 ${gameScore.detail}` : gameScore.state === "post" ? gameScore.detail : ""}
        </Typography>
      )}
      <TeamSlot
        team={teamA} isWinner={!!teamA && winner === teamA.name}
        isCorrect={!!result && !!teamA && winner === teamA.name && result === teamA.name}
        isWrong={!!result && !!teamA && winner === teamA.name && result !== teamA.name}
        score={gameScore?.teamA} isLive={isLive}
        onClick={() => teamA && onPick(teamA)} locked={locked} position="top"
      />
      <TeamSlot
        team={teamB} isWinner={!!teamB && winner === teamB.name}
        isCorrect={!!result && !!teamB && winner === teamB.name && result === teamB.name}
        isWrong={!!result && !!teamB && winner === teamB.name && result !== teamB.name}
        score={gameScore?.teamB} isLive={isLive}
        onClick={() => teamB && onPick(teamB)} locked={locked} position="bottom"
      />
    </Paper>
  );
}
