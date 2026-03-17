"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Container, Typography, Box, Autocomplete, TextField, Chip } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry, Team, Region, GameScore, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, REGION_COLORS, getTeamLogoUrl, parseRegionSeed, toRegionSeed, resolveRegionSeed } from "@/lib/bracketData";
import { ffGameId } from "@/components/bracket/FirstFour";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

const USER_COLORS = ["#42a5f5", "#ef5350", "#66bb6a", "#ffa726"];

interface BracketOption {
  label: string;
  username: string;
  bracket_name?: string;
}

interface PicksMap {
  [key: string]: Record<string, string>;
}

// Overlay matchup: shows both teams with colored dots for each user who picked that team
function OverlayMatchup({ teamA, teamB, gameId, allPicks, selected, result, regionColor }: {
  teamA?: Team; teamB?: Team; gameId: string;
  allPicks: PicksMap; selected: { key: string; label: string }[];
  result?: string; regionColor?: string;
}) {
  const border = regionColor || "#9e9e9e";
  return (
    <Box sx={{ my: 0.25 }}>
      {[teamA, teamB].map((team, ti) => {
        const isResult = !!result && !!team && (result === team.name || (team.regionSeed && result === team.regionSeed));
        return (
          <Box key={ti} sx={{
            display: "flex", alignItems: "center", gap: 0.5, px: 0.75, py: 0.25, minWidth: 140, minHeight: 22,
            borderTop: ti === 0 ? `1px solid ${border}` : "none",
            borderBottom: `1px solid ${border}`,
            borderLeft: `1px solid ${border}`,
            borderRight: `1px solid ${border}`,
            background: isResult ? "rgba(76,175,80,0.12)" : "transparent",
          }}>
            {team ? (<>
              <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, minWidth: 16, fontSize: "0.65rem" }}>{team.seed}</Typography>
              {(() => { const logo = getTeamLogoUrl(team.name); return logo ? <Box component="img" src={logo} alt="" sx={{ width: 14, height: 14, objectFit: "contain", flexShrink: 0 }} /> : null; })()}
              <Typography variant="body2" noWrap sx={{ fontSize: "0.7rem", fontWeight: isResult ? 700 : 400, flexGrow: 1 }}>{team.name}</Typography>
              {isResult && <Typography component="span" sx={{ fontSize: "0.6rem", color: "success.main" }}>✓</Typography>}
              <Box sx={{ display: "flex", gap: 0.25 }}>
                {selected.map((s, i) => {
                  const pick = allPicks[s.key]?.[gameId];
                  const matches = pick && team && (pick === team.name || (team.regionSeed && pick === team.regionSeed));
                  return matches ? (
                    <Box key={i} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: USER_COLORS[i], flexShrink: 0 }} title={s.label} />
                  ) : null;
                })}
              </Box>
            </>) : (
              <Typography variant="body2" sx={{ color: "text.disabled", fontSize: "0.7rem", fontStyle: "italic" }}>—</Typography>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

function getTeamForGame(region: Region, round: number, gameIndex: number, picks: Record<string, string>, firstFour?: FirstFourGame[], results?: Record<string, string>): { teamA?: Team; teamB?: Team } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find(t => t.seed === pair[0]);
    let teamB = region.teams.find(t => t.seed === pair[1]);
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
  const resolveTeam = (val: string): Team | undefined => {
    const parsed = parseRegionSeed(val);
    if (parsed) {
      if (firstFour) {
        const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
        if (ff) {
          const resolved = results?.[ffGameId(ff)];
          return { seed: parsed.seed, name: resolved || `${ff.teamA}/${ff.teamB}`, regionSeed: val };
        }
      }
      const t = region.teams.find(t => t.seed === parsed.seed);
      if (t) return { ...t, regionSeed: val };
    }
    const direct = region.teams.find(t => t.name === val);
    if (direct) return { ...direct, regionSeed: toRegionSeed(region.name, direct.seed) };
    return undefined;
  };
  return {
    teamA: prevA ? resolveTeam(prevA) : undefined,
    teamB: prevB ? resolveTeam(prevB) : undefined,
  };
}

function findTeam(regions: Region[], nameOrRS: string, firstFour?: FirstFourGame[], results?: Record<string, string>): Team | undefined {
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
  for (const r of regions) { const t = r.teams.find(t => t.name === nameOrRS); if (t) return { ...t, regionSeed: toRegionSeed(r.name, t.seed) }; }
  return undefined;
}

function OverlayRegion({ region, allPicks, selected, results, firstFour, direction }: {
  region: Region; allPicks: PicksMap; selected: { key: string; label: string }[];
  results?: Record<string, string>; firstFour?: FirstFourGame[]; direction: "left" | "right";
}) {
  const regionColor = REGION_COLORS[region.name] || "#9e9e9e";
  const gamesPerRound = [8, 4, 2, 1];
  // Use results for team resolution so the bracket structure is consistent
  const resolvePicks = results || {};

  const renderRound = (round: number) => (
    <Box key={round} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", minWidth: 150, flexShrink: 0 }}>
      {Array.from({ length: gamesPerRound[round] }, (_, i) => {
        const gameId = `${region.name}-${round}-${i}`;
        const { teamA, teamB } = getTeamForGame(region, round, i, resolvePicks, firstFour, results);
        return (
          <Box key={gameId} sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <OverlayMatchup teamA={teamA} teamB={teamB} gameId={gameId} allPicks={allPicks} selected={selected} result={results?.[gameId]} regionColor={regionColor} />
          </Box>
        );
      })}
    </Box>
  );

  const rounds = [0, 1, 2, 3];
  const ordered = direction === "left" ? rounds : [...rounds].reverse();

  const renderConnectors = (fromRound: number) => {
    const toCount = gamesPerRound[fromRound] / 2;
    return (
      <Box key={`conn-${fromRound}`} sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around", width: 16, flexShrink: 0 }}>
        {Array.from({ length: toCount }, (_, i) => (
          <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative" }}>
            <Box sx={{ flex: 1, borderRight: `2px solid ${regionColor}`, borderBottom: direction === "left" ? `2px solid ${regionColor}` : "none", borderTop: direction === "right" ? `2px solid ${regionColor}` : "none" }} />
            <Box sx={{ flex: 1, borderRight: `2px solid ${regionColor}`, borderTop: direction === "left" ? `2px solid ${regionColor}` : "none", borderBottom: direction === "right" ? `2px solid ${regionColor}` : "none" }} />
          </Box>
        ))}
      </Box>
    );
  };

  const elements: React.ReactNode[] = [];
  for (let i = 0; i < ordered.length; i++) {
    elements.push(renderRound(ordered[i]));
    if (i < ordered.length - 1) {
      const fromRound = direction === "left" ? ordered[i] : ordered[i + 1];
      elements.push(renderConnectors(fromRound));
    }
  }

  return (
    <Box>
      <Typography variant="subtitle2" align="center" sx={{ mb: 0.5, fontWeight: 700, color: regionColor }}>{region.name}</Typography>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "stretch", minHeight: 400 }}>{elements}</Box>
    </Box>
  );
}

function OverlayFinalFour({ regions, allPicks, selected, results, firstFour }: {
  regions: Region[]; allPicks: PicksMap; selected: { key: string; label: string }[];
  results?: Record<string, string>; firstFour?: FirstFourGame[];
}) {
  const resolvePicks = results || {};
  const eastW = resolvePicks[`${regions[0].name}-3-0`];
  const westW = resolvePicks[`${regions[1].name}-3-0`];
  const southW = resolvePicks[`${regions[2].name}-3-0`];
  const midwestW = resolvePicks[`${regions[3].name}-3-0`];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minWidth: 170 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Final Four</Typography>
      <OverlayMatchup teamA={eastW ? findTeam(regions, eastW, firstFour, results) : undefined} teamB={westW ? findTeam(regions, westW, firstFour, results) : undefined} gameId="ff-4-0" allPicks={allPicks} selected={selected} result={results?.["ff-4-0"]} />
      <Box sx={{ my: 1 }}>
        <Typography variant="caption" align="center" display="block" sx={{ fontWeight: 700, color: "primary.main", mb: 0.5 }}>Championship</Typography>
        <OverlayMatchup
          teamA={resolvePicks["ff-4-0"] ? findTeam(regions, resolvePicks["ff-4-0"], firstFour, results) : undefined}
          teamB={resolvePicks["ff-4-1"] ? findTeam(regions, resolvePicks["ff-4-1"], firstFour, results) : undefined}
          gameId="ff-5-0" allPicks={allPicks} selected={selected} result={results?.["ff-5-0"]}
        />
      </Box>
      <OverlayMatchup teamA={southW ? findTeam(regions, southW, firstFour, results) : undefined} teamB={midwestW ? findTeam(regions, midwestW, firstFour, results) : undefined} gameId="ff-4-1" allPicks={allPicks} selected={selected} result={results?.["ff-4-1"]} />
    </Box>
  );
}

export default function ComparePage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, firstFour, results, loading: tournLoading } = useTournament();
  const [options, setOptions] = useState<BracketOption[]>([]);
  const [selected, setSelected] = useState<(BracketOption | null)[]>([null, null, null, null]);
  const [allPicks, setAllPicks] = useState<PicksMap>({});

  useEffect(() => {
    if (!tournament) return;
    api.leaderboard.get(tournament.id).then(({ leaderboard }) => {
      setOptions(leaderboard.map((e: LeaderboardEntry) => ({
        label: e.bracket_name ? `${e.username} — ${e.bracket_name}` : e.username,
        username: e.username,
        bracket_name: e.bracket_name,
      })));
    });
  }, [tournament]);

  const loadPicks = useCallback((opt: BracketOption, idx: number) => {
    if (!tournament) return;
    const key = `${opt.username}|${opt.bracket_name || ""}`;
    if (allPicks[key]) return; // already loaded
    api.tournaments.viewUser(opt.username, tournament.id, opt.bracket_name).then(d => {
      if (d.picks) setAllPicks(prev => ({ ...prev, [key]: d.picks! }));
    });
  }, [tournament, allPicks]);

  const handleSelect = (idx: number, val: BracketOption | null) => {
    setSelected(prev => { const n = [...prev]; n[idx] = val; return n; });
    if (val) loadPicks(val, idx);
  };

  const activeSelected = useMemo(() =>
    selected.filter((s): s is BracketOption => s !== null).map(s => ({
      key: `${s.username}|${s.bracket_name || ""}`,
      label: s.label,
    })),
  [selected]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>Compare Brackets</Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2, alignItems: "center" }}>
          {[0, 1, 2, 3].map(i => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 220 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: USER_COLORS[i], flexShrink: 0 }} />
              <Autocomplete
                size="small"
                options={options}
                getOptionLabel={o => o.label}
                value={selected[i]}
                onChange={(_, v) => handleSelect(i, v)}
                renderInput={params => <TextField {...params} label={`Bracket ${i + 1}`} size="small" />}
                sx={{ minWidth: 200 }}
              />
            </Box>
          ))}
        </Box>
        {/* Legend */}
        {activeSelected.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            {activeSelected.map((s, i) => (
              <Chip key={i} size="small" label={s.label} sx={{ bgcolor: USER_COLORS[i], color: "common.white", fontWeight: 600 }} />
            ))}
          </Box>
        )}
        {regions && activeSelected.length > 0 && (
          <>
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch", mb: 2 }}>
              <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                <OverlayRegion region={regions[0]} allPicks={allPicks} selected={activeSelected} results={results} firstFour={firstFour} direction="left" />
                <OverlayFinalFour regions={regions} allPicks={allPicks} selected={activeSelected} results={results} firstFour={firstFour} />
                <OverlayRegion region={regions[1]} allPicks={allPicks} selected={activeSelected} results={results} firstFour={firstFour} direction="right" />
              </Box>
            </Box>
            <Box sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <Box sx={{ display: "flex", alignItems: "stretch", minWidth: "fit-content" }}>
                <OverlayRegion region={regions[2]} allPicks={allPicks} selected={activeSelected} results={results} firstFour={firstFour} direction="left" />
                <Box sx={{ minWidth: 170 }} />
                <OverlayRegion region={regions[3]} allPicks={allPicks} selected={activeSelected} results={results} firstFour={firstFour} direction="right" />
              </Box>
            </Box>
          </>
        )}
      </Container>
    </>
  );
}
