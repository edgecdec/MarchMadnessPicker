"use client";
import { useState } from "react";
import { Container, Typography, TextField, Button, Box, Paper } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import PlanEditor from "@/components/common/PlanEditor";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("NCAA Tournament");
  const [year, setYear] = useState("2026");
  const [lockTime, setLockTime] = useState("");
  const [msg, setMsg] = useState("");

  if (loading) return null;
  if (!user) return <AuthForm />;
  if (!user.is_admin) { window.location.href = "/"; return null; }

  const createTournament = async () => {
    try {
      const data = await api.admin.createTournament(name, parseInt(year), lockTime || undefined);
      setMsg(`Tournament created: ${data.id}`);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>

        <Box sx={{ mb: 3 }}>
          <PlanEditor />
        </Box>

        <Paper sx={{ p: 3 }}>
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
