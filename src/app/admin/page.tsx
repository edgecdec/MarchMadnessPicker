"use client";
import { useEffect, useState } from "react";
import { Container, Typography, TextField, Button, Box, Paper } from "@mui/material";
import Navbar from "@/components/Navbar";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("NCAA Tournament");
  const [year, setYear] = useState("2026");
  const [lockTime, setLockTime] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      if (!d.user?.is_admin) window.location.href = "/";
      else setUser(d.user);
    });
  }, []);

  const createTournament = async () => {
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_tournament", name, year: parseInt(year), lock_time: lockTime || null }),
    });
    const data = await res.json();
    setMsg(res.ok ? `Tournament created: ${data.id}` : data.error);
  };

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Create Tournament</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Year" value={year} onChange={e => setYear(e.target.value)} />
            <TextField label="Lock Time (ISO)" value={lockTime} onChange={e => setLockTime(e.target.value)}
              helperText="Picks locked after this time. e.g. 2026-03-19T12:00:00Z" />
            <Button variant="contained" onClick={createTournament}>Create</Button>
            {msg && <Typography variant="body2" color="text.secondary">{msg}</Typography>}
          </Box>
        </Paper>
      </Container>
    </>
  );
}
