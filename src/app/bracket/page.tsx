"use client";
import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import Navbar from "@/components/Navbar";
import Bracket from "@/components/Bracket";
import { Region } from "@/lib/bracketData";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [userPicks, setUserPicks] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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
        <Bracket
          regions={regions}
          tournamentId={tournament.id}
          initialPicks={userPicks}
          results={results}
          locked={tournament.lock_time ? new Date(tournament.lock_time) < new Date() : false}
        />
      </Container>
    </>
  );
}
