"use client";
import { Box } from "@mui/material";
import RegionBracket from "./RegionBracket";
import FinalFour from "./FinalFour";
import { Team, Region, GameScore, FirstFourGame } from "@/types";

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

export default function MediumBracket({ regions, picks, results, gameScores, onPick, locked, distribution, eliminated, firstFour }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {regions.map((region) => (
        <Box key={region.name} sx={{ width: "100%", overflowX: "auto" }}>
          <RegionBracket
            region={region} picks={picks} results={results}
            gameScores={gameScores} onPick={onPick} locked={locked}
            direction="left" distribution={distribution}
            eliminated={eliminated} firstFour={firstFour}
          />
        </Box>
      ))}
      <Box sx={{ py: 2 }}>
        <FinalFour
          regions={regions} picks={picks} results={results}
          gameScores={gameScores} onPick={onPick} locked={locked}
          distribution={distribution} eliminated={eliminated} firstFour={firstFour}
        />
      </Box>
    </Box>
  );
}
