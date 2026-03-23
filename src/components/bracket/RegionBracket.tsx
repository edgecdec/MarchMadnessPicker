"use client";
import { Box, Typography } from "@mui/material";
import Matchup from "./Matchup";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, REGION_COLORS, parseRegionSeed, toRegionSeed } from "@/lib/bracketData";
import { ffGameId } from "./FirstFour";

interface Props {
  region: Region;
  picks: Record<string, string>;
  results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean;
  direction: "left" | "right";
  distribution?: Record<string, Record<string, number>>;
  eliminated?: Set<string>;
  firstFour?: FirstFourGame[];
}

function getTeamForGame(
  region: Region,
  round: number,
  gameIndex: number,
  picks: Record<string, string>,
  firstFour?: FirstFourGame[],
  results?: Record<string, string>,
): { teamA?: Team; teamB?: Team; actualTeamA?: Team; actualTeamB?: Team } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find((t) => t.seed === pair[0]);
    let teamB = region.teams.find((t) => t.seed === pair[1]);

    // Add regionSeed to teams
    if (teamA) teamA = { ...teamA, regionSeed: toRegionSeed(region.name, teamA.seed) };
    if (teamB) teamB = { ...teamB, regionSeed: toRegionSeed(region.name, teamB.seed) };

    // Check if either slot is a First Four play-in
    if (firstFour) {
      for (const ff of firstFour) {
        if (ff.region !== region.name || (ff.seed !== pair[0] && ff.seed !== pair[1])) continue;
        const gid = ffGameId(ff);
        const resolved = results?.[gid];
        const placeholder: Team = { seed: ff.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: toRegionSeed(region.name, ff.seed) };
        if (ff.seed === pair[0]) teamA = placeholder;
        else teamB = placeholder;
      }
    }

    return { teamA, teamB };
  }
  // Teams come from winners of previous round (picks are now region-seed identifiers)
  const prevA = picks[`${region.name}-${round - 1}-${gameIndex * 2}`];
  const prevB = picks[`${region.name}-${round - 1}-${gameIndex * 2 + 1}`];
  const resolveTeam = (rs: string): Team | undefined => {
    const parsed = parseRegionSeed(rs);
    if (parsed) {
      const rsId = toRegionSeed(parsed.region, parsed.seed);
      // Check if this seed is a First Four play-in slot
      if (firstFour) {
        const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
        if (ff) {
          const resolved = results?.[ffGameId(ff)];
          return { seed: parsed.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: rsId };
        }
      }
      const team = region.teams.find(t => t.seed === parsed.seed);
      if (team) return { ...team, regionSeed: rsId };
    }
    // Fallback: try direct name match (for FF play-in picks stored as team names)
    const direct = region.teams.find(t => t.name === rs);
    if (direct) return { ...direct, regionSeed: toRegionSeed(region.name, direct.seed) };
    if (rs.includes("/") && firstFour) {
      const ff = firstFour.find(f => f.region === region.name && `${f.teamA}/${f.teamB}` === rs);
      if (ff) {
        const resolved = results?.[ffGameId(ff)];
        return { seed: ff.seed, name: resolved || rs, regionSeed: toRegionSeed(region.name, ff.seed) };
      }
    }
    return undefined;
  };
  const actualA = results?.[`${region.name}-${round - 1}-${gameIndex * 2}`];
  const actualB = results?.[`${region.name}-${round - 1}-${gameIndex * 2 + 1}`];
  const teamA = prevA ? resolveTeam(prevA) : undefined;
  const teamB = prevB ? resolveTeam(prevB) : undefined;
  const resolvedActualA = actualA ? resolveTeam(actualA) : undefined;
  const resolvedActualB = actualB ? resolveTeam(actualB) : undefined;
  return {
    teamA,
    teamB,
    actualTeamA: resolvedActualA && teamA && resolvedActualA.name !== teamA.name ? resolvedActualA : undefined,
    actualTeamB: resolvedActualB && teamB && resolvedActualB.name !== teamB.name ? resolvedActualB : undefined,
  };
}

export default function RegionBracket({ region, picks, results, gameScores, onPick, locked, direction, distribution, eliminated, firstFour }: Props) {
  const rounds = [0, 1, 2, 3]; // R64, R32, S16, E8
  const gamesPerRound = [8, 4, 2, 1];
  const regionColor = REGION_COLORS[region.name] || "#9e9e9e";

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
          minWidth: 155,
          flexShrink: 0,
        }}
      >
        {Array.from({ length: count }, (_, i) => {
          const gameId = `${region.name}-${round}-${i}`;
          const { teamA, teamB, actualTeamA, actualTeamB } = getTeamForGame(region, round, i, picks, firstFour, results);
          return (
            <Box key={gameId} sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
              <Matchup
                teamA={teamA}
                teamB={teamB}
                actualTeamA={actualTeamA}
                actualTeamB={actualTeamB}
                winner={picks[gameId]}
                result={results?.[gameId]}
                gameScore={gameScores?.[gameId]}
                onPick={(team) => onPick(gameId, team)}
                locked={locked}
                distribution={distribution?.[gameId]}
                regionColor={regionColor}
                eliminated={eliminated}
              />
            </Box>
          );
        })}
      </Box>
    );
  };

  const orderedRounds = direction === "left" ? rounds : [...rounds].reverse();

  // Connector column between two adjacent rounds
  const renderConnectors = (fromRound: number) => {
    const fromCount = gamesPerRound[fromRound];
    const toCount = fromCount / 2;
    const isLeft = direction === "left";
    const border = `2px solid ${regionColor}`;
    // Each pair of "from" matchups merges into one "to" matchup
    return (
      <Box
        key={`conn-${fromRound}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          width: 16,
          flexShrink: 0,
        }}
      >
        {Array.from({ length: toCount }, (_, i) => (
          <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            {/* Top half */}
            <Box sx={{ flex: 1, ...(isLeft ? { borderRight: border, borderBottom: border } : { borderLeft: border, borderBottom: border }) }} />
            {/* Bottom half */}
            <Box sx={{ flex: 1, ...(isLeft ? { borderRight: border, borderTop: border } : { borderLeft: border, borderTop: border }) }} />
          </Box>
        ))}
      </Box>
    );
  };

  // Build interleaved rounds and connectors
  const elements: React.ReactNode[] = [];
  for (let i = 0; i < orderedRounds.length; i++) {
    elements.push(renderRound(orderedRounds[i]));
    if (i < orderedRounds.length - 1) {
      // Determine which round is "earlier" (feeds into the next)
      const fromRound = direction === "left" ? orderedRounds[i] : orderedRounds[i + 1];
      elements.push(renderConnectors(fromRound));
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" align="center" sx={{ mb: 0.5, fontWeight: 700, color: regionColor }}>
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
        {elements}
      </Box>
    </Box>
  );
}
