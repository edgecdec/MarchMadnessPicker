"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Box, Autocomplete, TextField, Grid } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { LeaderboardEntry } from "@/types";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import AuthForm from "@/components/auth/AuthForm";

interface BracketOption {
  label: string;
  username: string;
  bracket_name?: string;
}

export default function ComparePage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, firstFour, results, loading: tournLoading } = useTournament();
  const [options, setOptions] = useState<BracketOption[]>([]);
  const [leftOption, setLeftOption] = useState<BracketOption | null>(null);
  const [rightOption, setRightOption] = useState<BracketOption | null>(null);
  const [leftPicks, setLeftPicks] = useState<Record<string, string> | null>(null);
  const [rightPicks, setRightPicks] = useState<Record<string, string> | null>(null);

  useEffect(() => {
    if (!tournament) return;
    api.leaderboard.get(tournament.id).then(({ leaderboard }) => {
      setOptions(leaderboard.map((e: LeaderboardEntry) => ({
        label: e.bracket_name ? `${e.username} — ${e.bracket_name}` : e.username,
        username: e.username,
        bracket_name: e.bracket_name,
      })));
    });
  }, [tournament]);

  const loadPicks = (opt: BracketOption, side: "left" | "right") => {
    if (!tournament) return;
    api.tournaments.viewUser(opt.username, tournament.id, opt.bracket_name).then((d) => {
      if (side === "left") setLeftPicks(d.picks);
      else setRightPicks(d.picks);
    });
  };

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>Compare Brackets</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={options}
              getOptionLabel={(o) => o.label}
              value={leftOption}
              onChange={(_, v) => { setLeftOption(v); if (v) loadPicks(v, "left"); else setLeftPicks(null); }}
              renderInput={(params) => <TextField {...params} label="Bracket A" size="small" />}
              sx={{ mb: 2 }}
            />
            {leftPicks && regions && (
              <Bracket regions={regions} firstFour={firstFour} initialPicks={leftPicks} results={results} locked />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              options={options}
              getOptionLabel={(o) => o.label}
              value={rightOption}
              onChange={(_, v) => { setRightOption(v); if (v) loadPicks(v, "right"); else setRightPicks(null); }}
              renderInput={(params) => <TextField {...params} label="Bracket B" size="small" />}
              sx={{ mb: 2 }}
            />
            {rightPicks && regions && (
              <Bracket regions={regions} firstFour={firstFour} initialPicks={rightPicks} results={results} locked />
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
