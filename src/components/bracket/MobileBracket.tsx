"use client";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import Matchup from "./Matchup";
import FinalFour from "./FinalFour";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, REGION_COLORS, parseRegionSeed, toRegionSeed, ffGameId } from "@/lib/bracketData";
import { useState } from "react";

interface Props {
  regions: Region[];
  picks: Record<string, string>;
  results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean;
  distribution?: Record<string, Record<string, number>>;
  eliminated?: Set<string>;
  firstFour?: FirstFourGame[];
}

const ROUND_NAMES = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8"];
const TAB_LABELS = ["R64 & R32", "Sweet 16 & Elite 8", "Final Four"];
const TAB_ROUNDS: number[][] = [[0, 1], [2, 3]];

function getTeamForGame(
  region: Region, round: number, gameIndex: number,
  picks: Record<string, string>, firstFour?: FirstFourGame[], results?: Record<string, string>,
): { teamA?: Team; teamB?: Team } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find((t) => t.seed === pair[0]);
    let teamB = region.teams.find((t) => t.seed === pair[1]);
    if (teamA) teamA = { ...teamA, regionSeed: toRegionSeed(region.name, teamA.seed) };
    if (teamB) teamB = { ...teamB, regionSeed: toRegionSeed(region.name, teamB.seed) };
    if (firstFour) {
      for (const ff of firstFour) {
        if (ff.region !== region.name || (ff.seed !== pair[0] && ff.seed !== pair[1])) continue;
        const gid = ffGameId(ff);
        const resolved = results?.[gid];
        const placeholder: Team = { seed: ff.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: toRegionSeed(region.name, ff.seed) };
        if (ff.seed === pair[0]) teamA = placeholder; else teamB = placeholder;
      }
    }
    return { teamA, teamB };
  }
  const prevA = picks[`${region.name}-${round - 1}-${gameIndex * 2}`];
  const prevB = picks[`${region.name}-${round - 1}-${gameIndex * 2 + 1}`];
  const resolveTeam = (rs: string): Team | undefined => {
    const parsed = parseRegionSeed(rs);
    if (parsed) {
      const rsId = toRegionSeed(parsed.region, parsed.seed);
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
    return undefined;
  };
  return { teamA: prevA ? resolveTeam(prevA) : undefined, teamB: prevB ? resolveTeam(prevB) : undefined };
}

export default function MobileBracket({ regions, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour }: Props) {
  const [tab, setTab] = useState(0);

  const renderRegionRound = (region: Region, round: number) => {
    const count = 8 / Math.pow(2, round);
    const color = REGION_COLORS[region.name] || "text.secondary";
    return (
      <Box key={`${region.name}-${round}`} sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color, display: "block", mb: 0.5 }}>
          {region.name} — {ROUND_NAMES[round]}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {Array.from({ length: count }, (_, i) => {
            const gameId = `${region.name}-${round}-${i}`;
            const { teamA, teamB } = getTeamForGame(region, round, i, picks, firstFour, results);
            return (
              <Matchup
                key={gameId}
                teamA={teamA} teamB={teamB}
                winner={picks[gameId]} result={results?.[gameId]}
                gameScore={gameScores?.[gameId]}
                onPick={(team) => onPick(gameId, team)}
                locked={locked} distribution={distribution?.[gameId]}
                regionColor={color} eliminated={eliminated}
              />
            );
          })}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        {TAB_LABELS.map((label) => <Tab key={label} label={label} sx={{ fontSize: "0.7rem", minHeight: 40, px: 0.5 }} />)}
      </Tabs>
      {tab < 2 ? (
        TAB_ROUNDS[tab].map((round) =>
          regions.map((region) => renderRegionRound(region, round))
        )
      ) : (
        <FinalFour
          regions={regions} picks={picks} results={results}
          gameScores={gameScores} onPick={onPick} locked={locked}
          distribution={distribution} eliminated={eliminated} firstFour={firstFour}
        />
      )}
    </Box>
  );
}
