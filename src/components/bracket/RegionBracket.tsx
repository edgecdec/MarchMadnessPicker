"use client";
import { Box, Typography } from "@mui/material";
import Matchup from "./Matchup";
import { Team, Region, GameScore } from "@/types";
import { SEED_ORDER_PAIRS } from "@/lib/bracketData";

interface Props {
  region: Region;
  picks: Record<string, string>;
  results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean;
  direction: "left" | "right";
}

function getTeamForGame(
  region: Region,
  round: number,
  gameIndex: number,
  picks: Record<string, string>
): { teamA?: Team; teamB?: Team } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    return {
      teamA: region.teams.find((t) => t.seed === pair[0]),
      teamB: region.teams.find((t) => t.seed === pair[1]),
    };
  }
  // Teams come from winners of previous round
  const prevA = picks[`${region.name}-${round - 1}-${gameIndex * 2}`];
  const prevB = picks[`${region.name}-${round - 1}-${gameIndex * 2 + 1}`];
  return {
    teamA: prevA ? region.teams.find((t) => t.name === prevA) : undefined,
    teamB: prevB ? region.teams.find((t) => t.name === prevB) : undefined,
  };
}

export default function RegionBracket({ region, picks, results, gameScores, onPick, locked, direction }: Props) {
  const rounds = [0, 1, 2, 3]; // R64, R32, S16, E8
  const gamesPerRound = [8, 4, 2, 1];

  const renderRound = (round: number) => {
    const count = gamesPerRound[round];
    // Vertical spacing increases each round to align with previous round's matchups
    const spacingMultiplier = Math.pow(2, round);

    return (
      <Box
        key={round}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          minWidth: 130,
          flexShrink: 0,
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const gameId = `${region.name}-${round}-${i}`;
          const { teamA, teamB } = getTeamForGame(region, round, i, picks);
          return (
            <Box key={gameId} sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
              <Matchup
                teamA={teamA}
                teamB={teamB}
                winner={picks[gameId]}
                result={results?.[gameId]}
                gameScore={gameScores?.[gameId]}
                onPick={(team) => onPick(gameId, team)}
                locked={locked}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  const orderedRounds = direction === "left" ? rounds : [...rounds].reverse();

  return (
    <Box>
      <Typography variant="subtitle2" align="center" sx={{ mb: 0.5, fontWeight: 700, color: "primary.main" }}>
        {region.name}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          minHeight: 400,
        }}
      >
        {orderedRounds.map((round) => renderRound(round))}
      </Box>
    </Box>
  );
}
