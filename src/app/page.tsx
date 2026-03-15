"use client";
import { Container, Typography, Button, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import AuthForm from "@/components/auth/AuthForm";
import Navbar from "@/components/common/Navbar";
import PickReminderBanner from "@/components/common/PickReminderBanner";

export default function Home() {
  const { user, loading } = useAuth();
  const { tournament, userPicks, activeBracket, loading: tournLoading } = useTournament();

  if (loading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <PickReminderBanner lockTime={tournament?.lock_time ?? null} picks={userPicks} bracketName={activeBracket} />
        <Typography variant="h3" gutterBottom>🏀 March Madness Picker</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome, {user.username}!
        </Typography>
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button variant="contained" href="/bracket">View Bracket & Make Picks</Button>
          <Button variant="outlined" href="/groups">Groups</Button>
          <Button variant="outlined" href="/leaderboard">Leaderboard</Button>
          {user.is_admin && <Button variant="outlined" color="warning" href="/admin">Admin</Button>}
        </Box>
      </Container>
    </>
  );
}
