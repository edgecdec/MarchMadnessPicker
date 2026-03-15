"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Typography, Tabs, Tab, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import AuthForm from "@/components/auth/AuthForm";

export default function ViewBracketPage() {
  const { username } = useParams<{ username: string }>();
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, firstFour, results, loading: tournLoading } = useTournament();
  const [viewPicks, setViewPicks] = useState<Record<string, string> | null>(null);
  const [brackets, setBrackets] = useState<{ id: string; bracket_name: string }[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament || !username) return;
    api.tournaments.viewUser(username, tournament.id)
      .then((d) => { setViewPicks(d.picks); setBrackets(d.brackets || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [tournament, username]);

  const handleTabChange = (_: any, idx: number) => {
    if (!tournament || !username) return;
    setActiveIdx(idx);
    const name = brackets[idx]?.bracket_name;
    if (name) {
      api.tournaments.viewUser(username, tournament.id, name)
        .then((d) => setViewPicks(d.picks))
        .catch(() => {});
    }
  };

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>{username}&apos;s Bracket</Typography>
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && brackets.length === 0 && (
          <Typography color="text.secondary">{username} hasn&apos;t submitted picks yet.</Typography>
        )}
        {!loading && !error && brackets.length > 1 && (
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeIdx} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
              {brackets.map((b) => <Tab key={b.id} label={b.bracket_name} />)}
            </Tabs>
          </Box>
        )}
        {!loading && !error && viewPicks && regions && (
          <Bracket regions={regions} firstFour={firstFour} initialPicks={viewPicks} results={results} locked />
        )}
      </Container>
    </>
  );
}
