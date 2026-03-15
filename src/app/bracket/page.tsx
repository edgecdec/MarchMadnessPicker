"use client";
import { Container, Typography } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import LiveScores from "@/components/bracket/LiveScores";
import AuthForm from "@/components/auth/AuthForm";

export default function BracketPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, results, userPicks, loading: tournLoading } = useTournament();

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  if (!tournament) {
    return (
      <><Navbar /><Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="text.secondary">No tournament created yet. An admin needs to create one first.</Typography>
      </Container></>
    );
  }

  if (!regions) {
    return (
      <><Navbar /><Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
        <Typography color="text.secondary">The bracket hasn't been loaded yet. Check back after Selection Sunday!</Typography>
      </Container></>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
        <LiveScores />
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
