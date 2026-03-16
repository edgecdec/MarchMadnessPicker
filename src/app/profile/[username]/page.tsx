"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Box, Link } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

const ROUND_LABELS = ["R64", "R32", "S16", "E8", "FF", "Champ"];

interface ProfileData {
  username: string;
  created_at: string;
  groups: { id: string; name: string; invite_code: string; member_count: number; brackets?: string[] }[];
  brackets: { id: string; bracket_name: string; submitted_at: string; tiebreaker: number | null; score: number; roundScores: number[] }[];
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament } = useTournament();
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const locked = tournament?.lock_time ? new Date(tournament.lock_time) <= new Date() : false;
  const isOwnProfile = user?.username === username;
  const showTiebreaker = locked || isOwnProfile;

  useEffect(() => {
    if (username) {
      api.profile.get(username).then(setProfile).catch((e) => setError(e.message));
    }
  }, [username]);

  if (authLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : !profile ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : (
          <>
            <Typography variant="h4" gutterBottom>🏀 {profile.username}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </Typography>

            <Typography variant="h6" sx={{ mb: 1 }}>Groups ({profile.groups.length})</Typography>
            {profile.groups.length === 0 ? (
              <Typography color="text.secondary" sx={{ mb: 3 }}>No groups yet.</Typography>
            ) : (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                {profile.groups.map((g) => (
                  <Chip
                    key={g.id}
                    label={`${g.name} (${g.member_count})${g.brackets?.length ? ` — ${g.brackets.join(", ")}` : ""}`}
                    variant="outlined"
                    component="a"
                    href={`/groups?g=${g.id}`}
                    clickable
                  />
                ))}
              </Box>
            )}

            <Typography variant="h6" sx={{ mb: 1 }}>Brackets ({profile.brackets.length})</Typography>
            {profile.brackets.length === 0 ? (
              <Typography color="text.secondary">No brackets submitted.</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Bracket</TableCell>
                      {ROUND_LABELS.map((l) => <TableCell key={l} align="right">{l}</TableCell>)}
                      <TableCell align="right">Total</TableCell>
                      {showTiebreaker && <TableCell align="right">Tiebreaker</TableCell>}
                      <TableCell>Submitted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {profile.brackets.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Link href={`/bracket/${profile.username}?bracket=${encodeURIComponent(b.bracket_name)}`} underline="hover">
                            {b.bracket_name}
                          </Link>
                        </TableCell>
                        {(b.roundScores || [0,0,0,0,0,0]).map((s, i) => (
                          <TableCell key={i} align="right">{s}</TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: "bold" }}>{b.score}</TableCell>
                        {showTiebreaker && <TableCell align="right">{b.tiebreaker != null ? b.tiebreaker : "—"}</TableCell>}
                        <TableCell>{new Date(b.submitted_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>
    </>
  );
}
