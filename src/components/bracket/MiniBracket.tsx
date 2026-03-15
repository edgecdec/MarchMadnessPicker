"use client";
import { Box, Typography } from "@mui/material";
import { Region } from "@/types";
import { getTeamLogoUrl } from "@/lib/bracketData";

interface Props {
  regions: Region[];
  picks: Record<string, string>;
  results?: Record<string, string>;
}

function MiniTeam({ name, seed, result, bold }: { name?: string; seed?: number; result?: string; bold?: boolean }) {
  if (!name) return <Typography sx={{ fontSize: "0.6rem", color: "#555", px: 0.5 }}>—</Typography>;
  const logo = getTeamLogoUrl(name);
  const correct = result && result === name;
  const wrong = result && result !== name && bold;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, px: 0.5, py: 0.125, background: correct ? "rgba(76,175,80,0.2)" : wrong ? "rgba(244,67,54,0.2)" : bold ? "rgba(255,111,0,0.15)" : "transparent", borderRadius: 0.5 }}>
      <Typography sx={{ fontSize: "0.55rem", color: "#888", fontWeight: 700, minWidth: 10 }}>{seed}</Typography>
      {logo && <Box component="img" src={logo} alt="" sx={{ width: 12, height: 12, objectFit: "contain" }} />}
      <Typography noWrap sx={{ fontSize: "0.6rem", fontWeight: bold ? 700 : 400, maxWidth: 60 }}>{name}</Typography>
    </Box>
  );
}

function findSeed(regions: Region[], name: string): number | undefined {
  for (const r of regions) { const t = r.teams.find(t => t.name === name); if (t) return t.seed; }
}

export default function MiniBracket({ regions, picks, results }: Props) {
  const ff = [
    picks[`${regions[0].name}-3-0`],
    picks[`${regions[1].name}-3-0`],
    picks[`${regions[2].name}-3-0`],
    picks[`${regions[3].name}-3-0`],
  ];
  const ffWinners = [picks["ff-4-0"], picks["ff-4-1"]];
  const champ = picks["ff-5-0"];

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, p: 0.5, border: "1px solid", borderColor: "divider", borderRadius: 1, background: "rgba(0,0,0,0.15)" }}>
      {/* Semis */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ border: "1px solid #333", borderRadius: 0.5 }}>
          <MiniTeam name={ff[0]} seed={ff[0] ? findSeed(regions, ff[0]) : undefined} result={results?.["ff-4-0"]} bold={ffWinners[0] === ff[0] && !!ff[0]} />
          <MiniTeam name={ff[1]} seed={ff[1] ? findSeed(regions, ff[1]) : undefined} result={results?.["ff-4-0"]} bold={ffWinners[0] === ff[1] && !!ff[1]} />
        </Box>
        <Box sx={{ border: "1px solid #333", borderRadius: 0.5 }}>
          <MiniTeam name={ff[2]} seed={ff[2] ? findSeed(regions, ff[2]) : undefined} result={results?.["ff-4-1"]} bold={ffWinners[1] === ff[2] && !!ff[2]} />
          <MiniTeam name={ff[3]} seed={ff[3] ? findSeed(regions, ff[3]) : undefined} result={results?.["ff-4-1"]} bold={ffWinners[1] === ff[3] && !!ff[3]} />
        </Box>
      </Box>
      {/* Championship */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
        <Box sx={{ border: "1px solid #333", borderRadius: 0.5 }}>
          <MiniTeam name={ffWinners[0]} seed={ffWinners[0] ? findSeed(regions, ffWinners[0]) : undefined} result={results?.["ff-5-0"]} bold={champ === ffWinners[0] && !!ffWinners[0]} />
          <MiniTeam name={ffWinners[1]} seed={ffWinners[1] ? findSeed(regions, ffWinners[1]) : undefined} result={results?.["ff-5-0"]} bold={champ === ffWinners[1] && !!ffWinners[1]} />
        </Box>
      </Box>
      {/* Champion */}
      {champ && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 0.5 }}>
          <Typography sx={{ fontSize: "0.8rem", lineHeight: 1 }}>🏆</Typography>
          {getTeamLogoUrl(champ) && <Box component="img" src={getTeamLogoUrl(champ)} alt="" sx={{ width: 16, height: 16, objectFit: "contain" }} />}
          <Typography noWrap sx={{ fontSize: "0.6rem", fontWeight: 800, maxWidth: 60 }}>{champ}</Typography>
        </Box>
      )}
    </Box>
  );
}
