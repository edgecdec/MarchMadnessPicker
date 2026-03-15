"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Link } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

const ROUND_LABELS = ["R64", "R32", "S16", "E8", "FF", "Champ"];

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

  const userBestRank = leaderboard.length > 0
    ? leaderboard.findIndex((e) => e.username === user?.username)
    : -1;
  const percentile = userBestRank >= 0 && leaderboard.length > 1
    ? Math.round(((leaderboard.length - 1 - userBestRank) / (leaderboard.length - 1)) * 100)
    : null;

  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Leaderboard</Typography>
        {percentile !== null && (
          <Typography variant="body1" sx={{ mb: 2 }} color="primary">
            Your bracket is in the {percentile === 0 ? "0th" : `${percentile}${percentile % 10 === 1 && percentile !== 11 ? "st" : percentile % 10 === 2 && percentile !== 12 ? "nd" : percentile % 10 === 3 && percentile !== 13 ? "rd" : "th"}`} percentile
          </Typography>
        )}
        {leaderboard.length === 0 ? (
          <Typography color="text.secondary">No picks submitted yet.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rank</TableCell>
                  <TableCell>Player</TableCell>
                  <TableCell>Bracket</TableCell>
                  {ROUND_LABELS.map((l) => (
                    <TableCell key={l} align="right">{l}</TableCell>
                  ))}
                  <TableCell align="right">Total</TableCell>
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
                    {(entry.roundScores || [0,0,0,0,0,0]).map((s, r) => (
                      <TableCell key={r} align="right">{s}</TableCell>
                    ))}
                    <TableCell align="right" sx={{ fontWeight: "bold" }}>{entry.score}</TableCell>
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
