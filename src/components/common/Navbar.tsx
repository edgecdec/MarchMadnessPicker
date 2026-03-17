"use client";
import { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip, Drawer, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { DarkMode, LightMode, Menu as MenuIcon } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useThemeMode } from "@/hooks/useThemeMode";
import ResultsBanner from "@/components/common/ResultsBanner";

const navLinks = [
  { label: "Bracket", href: "/bracket" },
  { label: "Groups", href: "/groups" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Compare", href: "/compare" },
  { label: "Who Picked", href: "/whopicked" },
  { label: "Simulate", href: "/simulate" },
  { label: "Stats", href: "/stats" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { mode, toggle } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
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
          {/* Desktop nav */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1, alignItems: "center" }}>
            {navLinks.map(l => <Button key={l.href} color="inherit" href={l.href}>{l.label}</Button>)}
            {user.is_admin && <Button color="warning" href="/admin">Admin</Button>}
            <Button color="inherit" href={`/profile/${user.username}`} size="small">{user.username}</Button>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton color="inherit" onClick={toggle} size="small">
                {mode === "dark" ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <Button color="inherit" onClick={handleLogout} size="small">Logout</Button>
          </Box>
          {/* Mobile hamburger */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center" }}>
            <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <IconButton color="inherit" onClick={toggle} size="small">
                {mode === "dark" ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Open navigation menu">
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="navigation" onClick={() => setDrawerOpen(false)}>
          <List>
            {navLinks.map(l => (
              <ListItemButton key={l.href} component="a" href={l.href}>
                <ListItemText primary={l.label} />
              </ListItemButton>
            ))}
            {user.is_admin && (
              <ListItemButton component="a" href="/admin">
                <ListItemText primary="Admin" sx={{ color: "warning.main" }} />
              </ListItemButton>
            )}
            <Divider />
            <ListItemButton component="a" href={`/profile/${user.username}`}>
              <ListItemText primary={user.username} />
            </ListItemButton>
            <ListItemButton onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
