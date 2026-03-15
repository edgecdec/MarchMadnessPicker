"use client";
import { useEffect, useState, useCallback } from "react";
import { Container, Typography } from "@mui/material";
import Navbar from "@/components/Navbar";
import Bracket from "@/components/Bracket";
import LiveScores from "@/components/LiveScores";
import { Region } from "@/lib/bracketData";
import { GameScore } from "@/components/Matchup";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [gameScores, setGameScores] = useState<Record<string, GameScore>>({});
  const [loading, setLoading] = useState(true);

  // Build a lookup: team name -> game IDs they play in
  const buildTeamGameMap = useCallback((regions: Region[], bracketResults: Record<string, string>) => {
    // Map ESPN short names to our bracket team names
    // This will be used to match live scores to bracket matchups
    const teamNames = new Set<string>();
    regions.forEach((r) => r.teams.forEach((t) => teamNames.add(t.name)));
    return teamNames;
  }, []);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (!d.user) { window.location.href = "/"; return; }
      setUser(d.user);

      fetch("/api/picks").then((r) => r.json()).then((td) => {
        const t = td.tournaments?.[0];
        if (!t) { setLoading(false); return; }
        setTournament(t);

        const bracket = typeof t.bracket_data === "string" ? JSON.parse(t.bracket_data) : t.bracket_data;
        if (bracket?.regions) setRegions(bracket.regions);

        const res = typeof t.results_data === "string" ? JSON.parse(t.results_data) : t.results_data;
        if (res && Object.keys(res).length > 0) setResults(res);

        fetch(`/api/picks?tournament_id=${t.id}`).then((r) => r.json()).then((pd) => {
          setUserPicks(pd.userPicks || {});
          setLoading(false);
        });
      });
    });
  }, []);

  if (!user || loading) return null;

  if (!tournament) {
    return (
      <>
        <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography color="text.secondary">No tournament created yet. An admin needs to create one first.</Typography>
        </Container>
      </>
    );
  }

  if (!regions) {
    return (
      <>
        <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
          <Typography color="text.secondary">The bracket hasn't been loaded yet. Check back after Selection Sunday!</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
        <LiveScores />
        <Bracket
          regions={regions}
          tournamentId={tournament.id}
          initialPicks={userPicks}
          results={results}
          gameScores={gameScores}
          locked={tournament.lock_time ? new Date(tournament.lock_time) < new Date() : false}
        />
      </Container>
    </>
  );
}
