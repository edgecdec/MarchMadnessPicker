"use client";
import { useState, useEffect } from "react";
import { Container, Typography, Button, Box } from "@mui/material";
import AuthForm from "@/components/AuthForm";
import Navbar from "@/components/Navbar";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => { setUser(d.user); setLoading(false); });
  }, []);

  if (loading) return null;

  if (!user) return <AuthForm onAuth={setUser} />;

  return (
    <>
      <Navbar user={user} onLogout={() => setUser(null)} />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h3" gutterBottom>🏀 March Madness Picker</Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Welcome, {user.username}!
        </Typography>
        <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
          <Button variant="contained" href="/bracket">View Bracket & Make Picks</Button>
          <Button variant="outlined" href="/leaderboard">Leaderboard</Button>
          {user.is_admin && <Button variant="outlined" color="warning" href="/admin">Admin</Button>}
        </Box>
      </Container>
    </>
  );
}
