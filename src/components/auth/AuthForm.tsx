"use client";
import { useState } from "react";
import { Box, TextField, Button, Typography, Paper, Tabs, Tab } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";

export default function AuthForm() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      if (tab === 0) await login(username, password);
      else await register(username, password);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Paper sx={{ p: 4, width: 360 }}>
        <Typography variant="h5" align="center" gutterBottom>🏀 March Madness</Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>
        <TextField fullWidth label="Username" value={username} onChange={e => setUsername(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }}
          onKeyDown={e => e.key === "Enter" && submit()} />
        {error && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{error}</Typography>}
        <Button fullWidth variant="contained" onClick={submit}>{tab === 0 ? "Login" : "Register"}</Button>
      </Paper>
    </Box>
  );
}
