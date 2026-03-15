"use client";
import { Box, Typography } from "@mui/material";
import Matchup from "./Matchup";
import { Team, Region } from "@/lib/bracketData";

interface Props {
  regions: Region[];
  picks: Record<string, string>;
  results?: Record<string, string>;
  onPick: (gameId: string, team: Team) => void;
  locked?: boolean;
}

function findTeam(regions: Region[], name: string): Team | undefined {
  for (const r of regions) {
    const t = r.teams.find((t) => t.name === name);
    if (t) return t;
  }
  return undefined;
}

export default function FinalFour({ regions, picks, results, onPick, locked }: Props) {
  // FF game 0: East winner vs West winner (top half)
  // FF game 1: South winner vs Midwest winner (bottom half)
  // Championship: FF0 winner vs FF1 winner
  const eastWinner = picks[`${regions[0].name}-3-0`];
  const westWinner = picks[`${regions[1].name}-3-0`];
  const southWinner = picks[`${regions[2].name}-3-0`];
  const midwestWinner = picks[`${regions[3].name}-3-0`];

  const ff0TeamA = eastWinner ? findTeam(regions, eastWinner) : undefined;
  const ff0TeamB = westWinner ? findTeam(regions, westWinner) : undefined;
  const ff1TeamA = southWinner ? findTeam(regions, southWinner) : undefined;
  const ff1TeamB = midwestWinner ? findTeam(regions, midwestWinner) : undefined;

  const ff0Winner = picks["ff-4-0"];
  const ff1Winner = picks["ff-4-1"];

  const champTeamA = ff0Winner ? findTeam(regions, ff0Winner) : undefined;
  const champTeamB = ff1Winner ? findTeam(regions, ff1Winner) : undefined;

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
        onPick={(team) => onPick("ff-4-0", team)}
        locked={locked}
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
          onPick={(team) => onPick("ff-5-0", team)}
          locked={locked}
        />
        {picks["ff-5-0"] && (
          <Typography variant="body2" align="center" sx={{ mt: 1, fontWeight: 700, color: "primary.main", fontSize: "0.85rem" }}>
            🏆 {picks["ff-5-0"]}
          </Typography>
        )}
      </Box>
      <Matchup
        teamA={ff1TeamA}
        teamB={ff1TeamB}
        winner={picks["ff-4-1"]}
        result={results?.["ff-4-1"]}
        onPick={(team) => onPick("ff-4-1", team)}
        locked={locked}
      />
    </Box>
  );
}
