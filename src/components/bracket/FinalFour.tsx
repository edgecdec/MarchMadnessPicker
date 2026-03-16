"use client";
import { Box, Typography } from "@mui/material";
import Matchup from "./Matchup";
import { Team, Region, GameScore, FirstFourGame } from "@/types";
import { getTeamLogoUrl, ffGameId } from "@/lib/bracketData";

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

function findTeam(regions: Region[], name: string, firstFour?: FirstFourGame[], results?: Record<string, string>): Team | undefined {
  for (const r of regions) {
    const t = r.teams.find((t) => t.name === name);
    if (t) return t;
  }
  if (name.includes("/") && firstFour) {
    const ff = firstFour.find((f) => `${f.teamA}/${f.teamB}` === name);
    if (ff) {
      const resolved = results?.[ffGameId(ff)];
      return { seed: ff.seed, name: resolved || name };
    }
  }
  if (firstFour) {
    const ff = firstFour.find((f) => f.teamA === name || f.teamB === name);
    if (ff) return { seed: ff.seed, name };
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

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minWidth: 160 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>
        Final Four
      </Typography>
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
      <Box sx={{ my: 1 }}>
        <Typography variant="caption" align="center" display="block" sx={{ fontWeight: 700, color: "primary.main", mb: 0.5 }}>
          Championship
        </Typography>
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
        {picks["ff-5-0"] && (() => {
          const champTeam = findTeam(regions, picks["ff-5-0"], firstFour, results);
          const logo = getTeamLogoUrl(picks["ff-5-0"]);
          return (
            <Box sx={{ mt: 1.5, mb: 0.5, display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, p: 1.5, borderRadius: 2, background: "linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,111,0,0.15))", border: "2px solid rgba(255,215,0,0.5)" }}>
              <Typography sx={{ fontSize: "1.5rem", lineHeight: 1 }}>🏆</Typography>
              {logo && <Box component="img" src={logo} alt="" sx={{ width: 48, height: 48, objectFit: "contain" }} />}
              <Typography variant="h6" align="center" sx={{ fontWeight: 800, color: "#FFD700", fontSize: "1.1rem", lineHeight: 1.2 }}>
                {picks["ff-5-0"]}
              </Typography>
              {champTeam && (
                <Typography variant="caption" sx={{ color: "#aaa", fontSize: "0.7rem" }}>
                  ({champTeam.seed}) seed
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: "#FFD700", fontWeight: 600, fontSize: "0.65rem", letterSpacing: 1, textTransform: "uppercase" }}>
                Champion
              </Typography>
            </Box>
          );
        })()}
      </Box>
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
  );
}
