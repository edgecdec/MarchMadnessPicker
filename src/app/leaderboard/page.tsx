"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import Navbar from "@/components/Navbar";

export default function LeaderboardPage() {
  const [user, setUser] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => { if (!d.user) window.location.href = "/"; else setUser(d.user); });
    fetch("/api/picks").then(r => r.json()).then(d => setTournaments(d.tournaments || []));
  }, []);

  useEffect(() => {
    if (tournaments.length > 0) {
      fetch(`/api/leaderboard?tournament_id=${tournaments[0].id}`).then(r => r.json()).then(d => setLeaderboard(d.leaderboard || []));
    }
  }, [tournaments]);

  if (!user) return null;

  return (
    <>
      <Navbar user={user} onLogout={() => { window.location.href = "/"; }} />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Leaderboard</Typography>
        {leaderboard.length === 0 ? (
          <Typography color="text.secondary">No picks submitted yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell align="right">Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry, i) => (
                  <TableRow key={entry.username}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{entry.username}</TableCell>
                    <TableCell align="right">{entry.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </>
  );
}
