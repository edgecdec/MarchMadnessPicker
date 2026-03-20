"use client";
import { Box, Tabs, Tab, Typography, Button } from "@mui/material";
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
const TAB_LABELS = ["R64 → R32", "S16 → E8", "Final Four"];
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

function MatchupPair({
  region, leftRound, rightRound, pairIndex, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour, color,
}: {
  region: Region; leftRound: number; rightRound: number; pairIndex: number;
  picks: Record<string, string>; results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean; distribution?: Record<string, Record<string, number>>;
  eliminated?: Set<string>; firstFour?: FirstFourGame[]; color: string;
}) {
  const leftIdx0 = pairIndex * 2;
  const leftIdx1 = pairIndex * 2 + 1;
  const leftId0 = `${region.name}-${leftRound}-${leftIdx0}`;
  const leftId1 = `${region.name}-${leftRound}-${leftIdx1}`;
  const rightId = `${region.name}-${rightRound}-${pairIndex}`;
  const left0 = getTeamForGame(region, leftRound, leftIdx0, picks, firstFour, results);
  const left1 = getTeamForGame(region, leftRound, leftIdx1, picks, firstFour, results);
  const right = getTeamForGame(region, rightRound, pairIndex, picks, firstFour, results);

  return (
    <Box sx={{ display: "flex", alignItems: "stretch", mb: 1.5 }}>
      {/* Left: two feeder games stacked */}
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        <Box sx={{ mb: 0.5 }}>
          <Matchup
            teamA={left0.teamA} teamB={left0.teamB}
            winner={picks[leftId0]} result={results?.[leftId0]}
            gameScore={gameScores?.[leftId0]}
            onPick={(team) => onPick(leftId0, team)}
            locked={locked} distribution={distribution?.[leftId0]}
            regionColor={color} eliminated={eliminated}
          />
        </Box>
        <Box>
          <Matchup
            teamA={left1.teamA} teamB={left1.teamB}
            winner={picks[leftId1]} result={results?.[leftId1]}
            gameScore={gameScores?.[leftId1]}
            onPick={(team) => onPick(leftId1, team)}
            locked={locked} distribution={distribution?.[leftId1]}
            regionColor={color} eliminated={eliminated}
          />
        </Box>
      </Box>

      {/* Connector */}
      <Box sx={{ width: 12, flexShrink: 0, position: "relative" }}>
        <Box sx={{
          position: "absolute",
          top: "25%", bottom: "25%",
          left: 0, right: 0,
          borderTop: 1, borderBottom: 1, borderRight: 1,
          borderColor: "divider",
        }} />
      </Box>

      {/* Right: one game centered */}
      <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Matchup
          teamA={right.teamA} teamB={right.teamB}
          winner={picks[rightId]} result={results?.[rightId]}
          gameScore={gameScores?.[rightId]}
          onPick={(team) => onPick(rightId, team)}
          locked={locked} distribution={distribution?.[rightId]}
          regionColor={color} eliminated={eliminated}
        />
      </Box>
    </Box>
  );
}

function RegionPairedRounds({
  region, leftRound, rightRound, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour,
}: {
  region: Region; leftRound: number; rightRound: number;
  picks: Record<string, string>; results?: Record<string, string>;
  gameScores?: Record<string, GameScore>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean; distribution?: Record<string, Record<string, number>>;
  eliminated?: Set<string>; firstFour?: FirstFourGame[];
}) {
  const color = REGION_COLORS[region.name] || "text.secondary";
  const rightCount = 8 / Math.pow(2, rightRound);

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: "flex", gap: 0, mb: 0.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color, width: 155, textAlign: "center", fontSize: "0.6rem" }}>
          {region.name} — {ROUND_NAMES[leftRound]}
        </Typography>
        <Box sx={{ width: 12 }} />
        <Typography variant="caption" sx={{ fontWeight: 700, color, width: 155, textAlign: "center", fontSize: "0.6rem" }}>
          {ROUND_NAMES[rightRound]}
        </Typography>
      </Box>
      <Box sx={{ overflow: "auto" }}>
        {Array.from({ length: rightCount }, (_, i) => (
          <MatchupPair
            key={i} region={region} leftRound={leftRound} rightRound={rightRound}
            pairIndex={i} picks={picks} results={results} gameScores={gameScores}
            onPick={onPick} locked={locked} distribution={distribution}
            eliminated={eliminated} firstFour={firstFour} color={color}
          />
        ))}
      </Box>
    </Box>
  );
}

export default function MobileBracket({ regions, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour }: Props) {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        {TAB_LABELS.map((label) => <Tab key={label} label={label} sx={{ fontSize: "0.7rem", minHeight: 40, px: 0.5 }} />)}
      </Tabs>
      {tab < 2 ? (
        regions.map((region) => (
          <RegionPairedRounds
            key={region.name} region={region}
            leftRound={TAB_ROUNDS[tab][0]} rightRound={TAB_ROUNDS[tab][1]}
            picks={picks} results={results} gameScores={gameScores}
            onPick={onPick} locked={locked} distribution={distribution}
            eliminated={eliminated} firstFour={firstFour}
          />
        ))
      ) : (
        <FinalFour
          regions={regions} picks={picks} results={results}
          gameScores={gameScores} onPick={onPick} locked={locked}
          distribution={distribution} eliminated={eliminated} firstFour={firstFour}
        />
      )}
      <Box sx={{ display: "flex", justifyContent: tab === 0 ? "flex-end" : tab === 2 ? "flex-start" : "space-between", mt: 2, mb: 1 }}>
        {tab > 0 && (
          <Button variant="outlined" size="small" onClick={() => setTab(tab - 1)}>
            ← {TAB_LABELS[tab - 1]}
          </Button>
        )}
        {tab < 2 && (
          <Button variant="outlined" size="small" onClick={() => setTab(tab + 1)}>
            {TAB_LABELS[tab + 1]} →
          </Button>
        )}
      </Box>
    </Box>
  );
}
