"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

export default function LeaderboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, loading: tournLoading } = useTournament();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (tournament) {
      api.leaderboard.get(tournament.id).then((d) => setLeaderboard(d.leaderboard));
    }
  }, [tournament]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
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
                  <TableCell>Bracket</TableCell>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Max Possible</TableCell>
                  <TableCell align="right">Tiebreaker</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaderboard.map((entry, i) => (
                  <TableRow key={`${entry.username}-${entry.bracket_name || i}`}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell><Link href={`/bracket/${entry.username}`} underline="hover">{entry.username}</Link></TableCell>
                    <TableCell>{entry.bracket_name || "—"}</TableCell>
                    <TableCell align="right">{entry.score}</TableCell>
                    <TableCell align="right">{entry.score + (entry.maxRemaining ?? 0)}</TableCell>
                    <TableCell align="right">{entry.tiebreaker != null ? entry.tiebreaker : "—"}</TableCell>
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
