"use client";
import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import Navbar from "@/components/Navbar";
import Bracket from "@/components/Bracket";
import { REGIONS_2025 } from "@/lib/bracketData";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);
  const [tournament, setTournament] = useState<any>(null);
  const [userPicks, setUserPicks] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (!d.user) { window.location.href = "/"; return; }
      setUser(d.user);
      // Load tournaments first
      fetch("/api/picks").then((r) => r.json()).then((td) => {
        const t = td.tournaments?.[0];
        setTournament(t);
        if (t) {
          // Load user's picks for this tournament
          fetch(`/api/picks?tournament_id=${t.id}`).then((r) => r.json()).then((pd) => {
            setUserPicks(pd.userPicks || {});
            setLoading(false);
          });
        } else {
          setUserPicks({});
          setLoading(false);
        }
      });
    });
  }, []);

  if (!user || loading) return null;

  return (
    <>
      <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>
          {tournament ? tournament.name : "NCAA Tournament 2025"} Bracket
        </Typography>
        {!tournament && (
          <Typography color="text.secondary">No tournament created yet. An admin needs to create one first.</Typography>
        )}
        <Bracket
          regions={REGIONS_2025}
          tournamentId={tournament?.id}
          initialPicks={userPicks || {}}
          locked={tournament?.lock_time ? new Date(tournament.lock_time) < new Date() : false}
        />
      </Container>
    </>
  );
}
