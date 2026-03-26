"use client";
import { useEffect, useState, useMemo } from "react";
import {
  Container, Typography, Box, Paper, Select, MenuItem, FormControl,
  InputLabel, Chip, TextField, Accordion, AccordionSummary, AccordionDetails,
  Tooltip, Link as MuiLink,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { Region, FirstFourGame } from "@/types";
import { SEED_ORDER_PAIRS, getRegionColor, getTeamLogoUrl } from "@/lib/bracketData";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import TeamLogo from "@/components/common/TeamLogo";
import { useThemeMode } from "@/hooks/useThemeMode";

type PickerInfo = { username: string; bracket_name: string | null };
type GamePicks = Record<string, { count: number; users: PickerInfo[] }>;
type AllGames = Record<string, GamePicks>;

function TeamPickRow({ team, pickers, total, regionColor }: {
  team: string; pickers: PickerInfo[]; total: number; regionColor: string;
}) {
  const pct = total > 0 ? Math.round((pickers.length / total) * 100) : 0;
  const logo = getTeamLogoUrl(team);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5 }}>
      <Box sx={{ width: pct + "%", minWidth: 4, height: 6, borderRadius: 3, bgcolor: regionColor, opacity: 0.5, position: "absolute", left: 0, top: 0, bottom: 0 }} />
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1, flex: 1, zIndex: 1 }}>
        {logo && <TeamLogo src={logo} size={20} />}
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8rem", minWidth: 100 }}>{team}</Typography>
        <Chip label={`${pickers.length} (${pct}%)`} size="small" sx={{ height: 20, fontSize: "0.7rem" }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {pickers.map((p, i) => (
            <Tooltip key={i} title={p.bracket_name ? `${p.username} — ${p.bracket_name}` : p.username}>
              <MuiLink href={`/bracket/${p.username}${p.bracket_name ? `/${encodeURIComponent(p.bracket_name)}` : ""}`} underline="hover">
                <Chip label={p.username} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem", cursor: "pointer" }} />
              </MuiLink>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function GameCard({ gameId, gamePicks, totalBrackets, regionColor, teamA, teamB, label: labelOverride }: {
  gameId: string; gamePicks: GamePicks; totalBrackets: number;
  regionColor: string; teamA?: string; teamB?: string; label?: string;
}) {
  const teams = Object.keys(gamePicks);
  if (teams.length === 0) return null;

  const label = labelOverride || (teamA && teamB ? `${teamA} vs ${teamB}` : formatGameId(gameId));

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mb: 1 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.8rem", mb: 0.5, color: regionColor }}>
        {label}
      </Typography>
      {teams.sort((a, b) => gamePicks[b].count - gamePicks[a].count).map((team) => (
        <Box key={team} sx={{ position: "relative", mb: 0.5 }}>
          <TeamPickRow team={team} pickers={gamePicks[team].users} total={totalBrackets} regionColor={regionColor} />
        </Box>
      ))}
    </Paper>
  );
}

const ROUND_NAMES = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8"];
function ffLabel(gameId: string, regions: Region[]): string {
  if (gameId === "ff-5-0") return "Championship";
  if (gameId === "ff-4-0" && regions.length >= 4) return `Final Four — ${regions[0].name} / ${regions[2].name}`;
  if (gameId === "ff-4-1" && regions.length >= 4) return `Final Four — ${regions[1].name} / ${regions[3].name}`;
  return gameId;
}

function formatGameId(gameId: string): string {
  const parts = gameId.split("-");
  if (parts.length === 3) {
    const [region, round, index] = parts;
    const roundName = ROUND_NAMES[parseInt(round)];
    if (roundName) return `${region} — ${roundName} — Game ${parseInt(index) + 1}`;
  }
  return gameId;
}

function getMatchupTeams(
  region: Region, round: number, gameIndex: number,
  allGames: AllGames, firstFour?: FirstFourGame[],
): { teamA?: string; teamB?: string } {
  if (round === 0) {
    const pair = SEED_ORDER_PAIRS[gameIndex];
    let teamA = region.teams.find(t => t.seed === pair[0])?.name;
    let teamB = region.teams.find(t => t.seed === pair[1])?.name;
    if (firstFour) {
      for (const ff of firstFour) {
        if (ff.region !== region.name || (ff.seed !== pair[0] && ff.seed !== pair[1])) continue;
        if (ff.seed === pair[0]) teamA = `${ff.teamA}/${ff.teamB}`;
        else teamB = `${ff.teamA}/${ff.teamB}`;
      }
    }
    return { teamA, teamB };
  }
  // For later rounds, the two teams are whoever was picked in the previous round
  const prevA = `${region.name}-${round - 1}-${gameIndex * 2}`;
  const prevB = `${region.name}-${round - 1}-${gameIndex * 2 + 1}`;
  const teamsA = allGames[prevA] ? Object.keys(allGames[prevA]) : [];
  const teamsB = allGames[prevB] ? Object.keys(allGames[prevB]) : [];
  return { teamA: teamsA[0], teamB: teamsB[0] };
}

export default function WhoPickedPage() {
  const { user, loading: authLoading } = useAuth();
  const { mode } = useThemeMode();
  const { tournament, regions: tournRegions, firstFour, loading: tournLoading } = useTournament();
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState("");
  const [games, setGames] = useState<AllGames>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user) api.groups.list().then((d) => setGroups(d.groups));
  }, [user]);

  useEffect(() => {
    if (groupId && tournament) {
      api.tournaments.whoPicked(groupId, tournament.id).then((d) => setGames(d.games));
    }
  }, [groupId, tournament]);

  const totalBrackets = useMemo(() => {
    const userSet = new Set<string>();
    for (const gp of Object.values(games)) {
      for (const tp of Object.values(gp)) {
        for (const u of tp.users) userSet.add(`${u.username}|${u.bracket_name}`);
      }
    }
    return userSet.size;
  }, [games]);

  const regions: Region[] = tournRegions || [];

  // Filter games by search (team name)
  const matchesSearch = (gamePicks: GamePicks) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.keys(gamePicks).some(t => t.toLowerCase().includes(s));
  };

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  const hasGames = Object.keys(games).length > 0;

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>🔍 Who Picked Whom</Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Group</InputLabel>
            <Select value={groupId} label="Select Group" onChange={(e) => setGroupId(e.target.value)}>
              {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
            </Select>
          </FormControl>
          {hasGames && (
            <TextField size="small" placeholder="Search team..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 180 }} />
          )}
          {hasGames && (
            <Chip label={`${totalBrackets} bracket${totalBrackets !== 1 ? "s" : ""}`} size="small" variant="outlined" />
          )}
        </Box>

        {!groupId && <Typography color="text.secondary">Select a group to see who picked whom.</Typography>}
        {groupId && !hasGames && <Typography color="text.secondary">No pick data available. Picks are visible after lock time.</Typography>}

        {hasGames && (
          <>
            {/* Final Four */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>🏆 Final Four & Championship</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {["ff-4-0", "ff-4-1", "ff-5-0"].map((gid) => {
                  const gp = games[gid];
                  if (!gp || !matchesSearch(gp)) return null;
                  return <GameCard key={gid} gameId={gid} gamePicks={gp} totalBrackets={totalBrackets} regionColor="#FFB300" label={ffLabel(gid, regions)} />;
                })}
              </AccordionDetails>
            </Accordion>

            {/* Regions */}
            {regions.map((region) => {
              const regionColor = getRegionColor(region.name, mode);
              return (
                <Accordion key={region.name} defaultExpanded={false}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 700, color: regionColor }}>{region.name}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {ROUND_NAMES.map((roundName, round) => {
                      const count = 8 / Math.pow(2, round);
                      const roundGames = Array.from({ length: count }, (_, i) => {
                        const gid = `${region.name}-${round}-${i}`;
                        const gp = games[gid];
                        if (!gp || !matchesSearch(gp)) return null;
                        const { teamA, teamB } = getMatchupTeams(region, round, i, games, firstFour);
                        return <GameCard key={gid} gameId={gid} gamePicks={gp} totalBrackets={totalBrackets} regionColor={regionColor} teamA={teamA} teamB={teamB} />;
                      });
                      if (roundGames.every(g => g === null)) return null;
                      return (
                        <Box key={round} sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "text.secondary" }}>{roundName}</Typography>
                          {roundGames}
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </Container>
    </>
  );
}
