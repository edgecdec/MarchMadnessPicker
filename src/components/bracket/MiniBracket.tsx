"use client";
import { Box, Typography } from "@mui/material";
import { Region, FirstFourGame } from "@/types";
import { getTeamLogoUrl, resolveRegionSeed, parseRegionSeed } from "@/lib/bracketData";
import TeamLogo from "@/components/common/TeamLogo";

interface Props {
  regions: Region[];
  picks: Record<string, string>;
  results?: Record<string, string>;
  firstFour?: FirstFourGame[];
}

function MiniTeam({ name, seed, result, bold }: { name?: string; seed?: number; result?: string; bold?: boolean }) {
  if (!name) return <Typography sx={{ fontSize: "0.6rem", color: "text.disabled", px: 0.5 }}>—</Typography>;
  const logo = getTeamLogoUrl(name);
  const correct = result && result === name;
  const wrong = result && result !== name && bold;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, px: 0.5, py: 0.125, background: correct ? "rgba(76,175,80,0.2)" : wrong ? "rgba(244,67,54,0.2)" : bold ? "rgba(66,165,245,0.2)" : "transparent", borderRadius: 0.5 }}>
      <Typography sx={{ fontSize: "0.55rem", color: "text.disabled", fontWeight: 700, minWidth: 10 }}>{seed}</Typography>
      {logo && <TeamLogo src={logo} size={12} />}
      <Typography noWrap sx={{ fontSize: "0.6rem", fontWeight: bold ? 700 : 400, maxWidth: 60 }}>{name}</Typography>
    </Box>
  );
}

function findSeed(regions: Region[], nameOrRS: string): number | undefined {
  const parsed = parseRegionSeed(nameOrRS);
  if (parsed) return parsed.seed;
  for (const r of regions) { const t = r.teams.find(t => t.name === nameOrRS); if (t) return t.seed; }
}

export default function MiniBracket({ regions, picks, results, firstFour }: Props) {
  const resolve = (val?: string) => val ? resolveRegionSeed(val, regions, firstFour, results) : undefined;
  const ff = [
    resolve(picks[`${regions[0].name}-3-0`]),
    resolve(picks[`${regions[1].name}-3-0`]),
    resolve(picks[`${regions[2].name}-3-0`]),
    resolve(picks[`${regions[3].name}-3-0`]),
  ];
  const ffRaw = [picks[`${regions[0].name}-3-0`], picks[`${regions[1].name}-3-0`], picks[`${regions[2].name}-3-0`], picks[`${regions[3].name}-3-0`]];
  const ffWinners = [resolve(picks["ff-4-0"]), resolve(picks["ff-4-1"])];
  const ffWinnersRaw = [picks["ff-4-0"], picks["ff-4-1"]];
  const champ = resolve(picks["ff-5-0"]);
  const champResult = results?.["ff-5-0"] ? resolve(results["ff-5-0"]) : undefined;

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, p: 0.5, border: "1px solid", borderColor: "divider", borderRadius: 1, bgcolor: "action.hover" }}>
      {/* Semis */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0.5 }}>
          <MiniTeam name={ff[0]} seed={ff[0] ? findSeed(regions, ffRaw[0]) : undefined} result={results?.["ff-4-0"] ? resolve(results["ff-4-0"]) : undefined} bold={ffWinnersRaw[0] === ffRaw[0] && !!ff[0]} />
          <MiniTeam name={ff[1]} seed={ff[1] ? findSeed(regions, ffRaw[1]) : undefined} result={results?.["ff-4-0"] ? resolve(results["ff-4-0"]) : undefined} bold={ffWinnersRaw[0] === ffRaw[1] && !!ff[1]} />
        </Box>
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0.5 }}>
          <MiniTeam name={ff[2]} seed={ff[2] ? findSeed(regions, ffRaw[2]) : undefined} result={results?.["ff-4-1"] ? resolve(results["ff-4-1"]) : undefined} bold={ffWinnersRaw[1] === ffRaw[2] && !!ff[2]} />
          <MiniTeam name={ff[3]} seed={ff[3] ? findSeed(regions, ffRaw[3]) : undefined} result={results?.["ff-4-1"] ? resolve(results["ff-4-1"]) : undefined} bold={ffWinnersRaw[1] === ffRaw[3] && !!ff[3]} />
        </Box>
      </Box>
      {/* Championship */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.25 }}>
        <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 0.5 }}>
          <MiniTeam name={ffWinners[0]} seed={ffWinners[0] ? findSeed(regions, ffWinnersRaw[0]) : undefined} result={champResult} bold={picks["ff-5-0"] === ffWinnersRaw[0] && !!ffWinners[0]} />
          <MiniTeam name={ffWinners[1]} seed={ffWinners[1] ? findSeed(regions, ffWinnersRaw[1]) : undefined} result={champResult} bold={picks["ff-5-0"] === ffWinnersRaw[1] && !!ffWinners[1]} />
        </Box>
      </Box>
      {/* Champion */}
      {champ && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", px: 0.5 }}>
          <Typography sx={{ fontSize: "0.8rem", lineHeight: 1 }}>🏆</Typography>
          {getTeamLogoUrl(champ) && <TeamLogo src={getTeamLogoUrl(champ)!} size={16} />}
          <Typography noWrap sx={{ fontSize: "0.6rem", fontWeight: 800, maxWidth: 60 }}>{champ}</Typography>
        </Box>
      )}
    </Box>
  );
}
