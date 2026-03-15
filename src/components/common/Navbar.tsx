"use client";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useThemeMode } from "@/hooks/useThemeMode";
import ResultsBanner from "@/components/common/ResultsBanner";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <>
      <ResultsBanner />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, cursor: "pointer" }} onClick={() => window.location.href = "/"}>
            🏀 March Madness
          </Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button color="inherit" href="/bracket">Bracket</Button>
            <Button color="inherit" href="/groups">Groups</Button>
            <Button color="inherit" href="/leaderboard">Leaderboard</Button>
            <Button color="inherit" href="/compare">Compare</Button>
            {user.is_admin && <Button color="warning" href="/admin">Admin</Button>}
            <Button color="inherit" href={`/profile/${user.username}`} size="small">{user.username}</Button>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton color="inherit" onClick={toggle} size="small">
                {mode === "dark" ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <Button color="inherit" onClick={handleLogout} size="small">Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}
