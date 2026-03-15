"use client";
import { useState, useEffect } from "react";
import { Container, Typography, Box, Paper, Chip, LinearProgress, Link as MuiLink } from "@mui/material";
import { EmojiEvents, TrendingUp, TrendingDown, Whatshot } from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { getRoundName } from "@/lib/scoring";
import { getTeamLogoUrl } from "@/lib/bracketData";
import { api } from "@/lib/api";
import AuthForm from "@/components/auth/AuthForm";
import Navbar from "@/components/common/Navbar";

interface Stats {
  totalBrackets: number;
  champions: { team: string; count: number; pct: number; seed: number }[];
  biggestUpset: { team: string; seed: number; round: number; count: number } | null;
  mostChalk: { username: string; bracket_name: string; score: number } | null;
  mostContrarian: { username: string; bracket_name: string; score: number } | null;
}

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, loading: tLoading } = useTournament();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!tournament) return;
    api.stats.get(tournament.id).then(({ stats }) => setStats(stats));
  }, [tournament]);

  if (authLoading || tLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>📊 Bracket Stats</Typography>
        {!stats ? (
          <Typography color="text.secondary">Stats available after brackets lock.</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography color="text.secondary">{stats.totalBrackets} brackets submitted</Typography>

            {/* Most Popular Champions */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><EmojiEvents sx={{ verticalAlign: "middle", mr: 1 }} />Most Popular Champions</Typography>
              {stats.champions.slice(0, 10).map((c) => (
                <Box key={c.team} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  {getTeamLogoUrl(c.team) && <Box component="img" src={getTeamLogoUrl(c.team)} sx={{ width: 28, height: 28 }} />}
                  <Typography sx={{ minWidth: 140 }}>({c.seed}) {c.team}</Typography>
                  <LinearProgress variant="determinate" value={c.pct} sx={{ flex: 1, height: 10, borderRadius: 5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70, textAlign: "right" }}>{c.count} ({c.pct}%)</Typography>
                </Box>
              ))}
            </Paper>

            {/* Biggest Upset Pick */}
            {stats.biggestUpset && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom><Whatshot sx={{ verticalAlign: "middle", mr: 1 }} />Biggest Upset Pick</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {getTeamLogoUrl(stats.biggestUpset.team) && <Box component="img" src={getTeamLogoUrl(stats.biggestUpset.team)} sx={{ width: 36, height: 36 }} />}
                  <Box>
                    <Typography variant="h6">({stats.biggestUpset.seed}) {stats.biggestUpset.team}</Typography>
                    <Typography color="text.secondary">
                      Picked to win {getRoundName(stats.biggestUpset.round)} by {stats.biggestUpset.count} bracket{stats.biggestUpset.count !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* Chalk vs Contrarian */}
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {stats.mostChalk && (
                <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
                  <Typography variant="h6" gutterBottom><TrendingUp sx={{ verticalAlign: "middle", mr: 1 }} />Most Chalk</Typography>
                  <MuiLink href={`/bracket/${stats.mostChalk.username}/${encodeURIComponent(stats.mostChalk.bracket_name)}`} underline="hover">
                    <Typography variant="h6">{stats.mostChalk.username}</Typography>
                  </MuiLink>
                  <Typography color="text.secondary">{stats.mostChalk.bracket_name}</Typography>
                  <Chip label={`Chalk score: ${stats.mostChalk.score}`} size="small" sx={{ mt: 1 }} />
                </Paper>
              )}
              {stats.mostContrarian && (
                <Paper sx={{ p: 3, flex: 1, minWidth: 250 }}>
                  <Typography variant="h6" gutterBottom><TrendingDown sx={{ verticalAlign: "middle", mr: 1 }} />Most Contrarian</Typography>
                  <MuiLink href={`/bracket/${stats.mostContrarian.username}/${encodeURIComponent(stats.mostContrarian.bracket_name)}`} underline="hover">
                    <Typography variant="h6">{stats.mostContrarian.username}</Typography>
                  </MuiLink>
                  <Typography color="text.secondary">{stats.mostContrarian.bracket_name}</Typography>
                  <Chip label={`Chalk score: ${stats.mostContrarian.score}`} size="small" sx={{ mt: 1 }} />
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Container>
    </>
  );
}
