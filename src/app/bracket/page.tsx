"use client";
import { useEffect, useState } from "react";
import { Container, Typography } from "@mui/material";
import Navbar from "@/components/Navbar";

export default function BracketPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => { if (!d.user) window.location.href = "/"; else setUser(d.user); });
  }, []);

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Tournament Bracket</Typography>
        <Typography color="text.secondary">
          The bracket will appear here once the tournament field is announced and an admin loads the data.
        </Typography>
      </Container>
    </>
  );
}
