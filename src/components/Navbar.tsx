"use client";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

interface Props {
  user: { username: string; is_admin: boolean };
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: Props) {
  const handleLogout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    onLogout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: "pointer" }} onClick={() => window.location.href = "/"}>
          🏀 March Madness
        </Typography>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button color="inherit" href="/bracket">Bracket</Button>
          <Button color="inherit" href="/leaderboard">Leaderboard</Button>
          {user.is_admin && <Button color="warning" href="/admin">Admin</Button>}
          <Typography variant="body2" sx={{ mx: 1 }}>{user.username}</Typography>
          <Button color="inherit" onClick={handleLogout} size="small">Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
