"use client";
import { Box, Typography } from "@mui/material";
import Matchup from "./Matchup";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { ffGameId, parseRegionSeed, toRegionSeed } from "@/lib/bracketData";

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

function findTeam(regions: Region[], nameOrRS: string, firstFour?: FirstFourGame[], results?: Record<string, string>): Team | undefined {
  // Try parsing as region-seed first
  const parsed = parseRegionSeed(nameOrRS);
  if (parsed) {
    const region = regions.find(r => r.name === parsed.region);
    if (region) {
      if (firstFour) {
        const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
        if (ff) {
          const resolved = results?.[ffGameId(ff)];
          return { seed: parsed.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: nameOrRS };
        }
      }
      const t = region.teams.find(t => t.seed === parsed.seed);
      if (t) return { ...t, regionSeed: nameOrRS };
    }
  }
  // Fallback: name-based lookup (for legacy data)
  for (const r of regions) {
    const t = r.teams.find((t) => t.name === nameOrRS);
    if (t) return { ...t, regionSeed: toRegionSeed(r.name, t.seed) };
  }
  if (nameOrRS.includes("/") && firstFour) {
    const ff = firstFour.find((f) => `${f.teamA}/${f.teamB}` === nameOrRS);
    if (ff) {
      const resolved = results?.[ffGameId(ff)];
      return { seed: ff.seed, name: resolved || nameOrRS, regionSeed: toRegionSeed(ff.region, ff.seed) };
    }
  }
  if (firstFour) {
    const ff = firstFour.find((f) => f.teamA === nameOrRS || f.teamB === nameOrRS);
    if (ff) return { seed: ff.seed, name: nameOrRS, regionSeed: toRegionSeed(ff.region, ff.seed) };
  }
  return undefined;
}

export default function FinalFour({ regions, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour }: Props) {
  // FF game 0: East(0) vs South(2) — LEFT side (top-left vs bottom-left)
  // FF game 1: West(1) vs Midwest(3) — RIGHT side (top-right vs bottom-right)
  // Championship: FF0 winner vs FF1 winner
  const eastWinner = picks[`${regions[0].name}-3-0`];
  const southWinner = picks[`${regions[2].name}-3-0`];
  const westWinner = picks[`${regions[1].name}-3-0`];
  const midwestWinner = picks[`${regions[3].name}-3-0`];

  const ff0TeamA = eastWinner ? findTeam(regions, eastWinner, firstFour, results) : undefined;
  const ff0TeamB = southWinner ? findTeam(regions, southWinner, firstFour, results) : undefined;
  const ff1TeamA = westWinner ? findTeam(regions, westWinner, firstFour, results) : undefined;
  const ff1TeamB = midwestWinner ? findTeam(regions, midwestWinner, firstFour, results) : undefined;

  const ff0Winner = picks["ff-4-0"];
  const ff1Winner = picks["ff-4-1"];

  const champTeamA = ff0Winner ? findTeam(regions, ff0Winner, firstFour, results) : undefined;
  const champTeamB = ff1Winner ? findTeam(regions, ff1Winner, firstFour, results) : undefined;

  const ffWrap = {
    p: 1,
    borderRadius: 2,
    border: "1.5px solid",
    borderColor: "divider",
    bgcolor: "action.hover",
  } as const;
  const champWrap = {
    p: 1.5,
    borderRadius: 2,
    border: "2px solid",
    borderColor: "warning.main",
    bgcolor: "action.hover",
  } as const;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minWidth: 180, py: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 1, textTransform: "uppercase", fontSize: "0.75rem" }}>
        Final Four
      </Typography>
      <Box sx={ffWrap}>
        <Matchup
          teamA={ff0TeamA}
          teamB={ff0TeamB}
          winner={picks["ff-4-0"]}
          result={results?.["ff-4-0"]}
          gameScore={gameScores?.["ff-4-0"]}
          onPick={(team) => onPick("ff-4-0", team)}
          locked={locked}
          distribution={distribution?.["ff-4-0"]}
          eliminated={eliminated}
        />
      </Box>
      <Box sx={{ my: 0.5 }}>
        <Typography variant="caption" align="center" display="block" sx={{ fontWeight: 800, color: "warning.main", mb: 0.75, fontSize: "0.8rem", letterSpacing: 1, textTransform: "uppercase" }}>
          🏆 Championship
        </Typography>
        <Box sx={champWrap}>
          <Matchup
            teamA={champTeamA}
            teamB={champTeamB}
            winner={picks["ff-5-0"]}
            result={results?.["ff-5-0"]}
            gameScore={gameScores?.["ff-5-0"]}
            onPick={(team) => onPick("ff-5-0", team)}
            locked={locked}
            distribution={distribution?.["ff-5-0"]}
            eliminated={eliminated}
          />
        </Box>
      </Box>
      <Box sx={ffWrap}>
        <Matchup
          teamA={ff1TeamA}
          teamB={ff1TeamB}
          winner={picks["ff-4-1"]}
          result={results?.["ff-4-1"]}
          gameScore={gameScores?.["ff-4-1"]}
          onPick={(team) => onPick("ff-4-1", team)}
          locked={locked}
          distribution={distribution?.["ff-4-1"]}
          eliminated={eliminated}
        />
      </Box>
    </Box>
  );
}
