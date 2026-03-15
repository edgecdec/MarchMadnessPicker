"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, List, ListItemButton, ListItemText, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import Link from "next/link";

export default function ViewBracketPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { tournament, regions, firstFour, results, loading: tournLoading } = useTournament();
  const [viewPicks, setViewPicks] = useState<Record<string, string> | null>(null);
  const [brackets, setBrackets] = useState<{ id: string; bracket_name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && username && user.username.toLowerCase() === username.toLowerCase()) {
      router.replace("/bracket");
      return;
    }
    if (!tournament || !username) return;
    api.tournaments.viewUser(username, tournament.id)
      .then((d) => { setViewPicks(d.picks); setBrackets(d.brackets || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [tournament, username, user, router]);

  if (tournLoading) return null;

  const showList = brackets.length > 1;

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>{username}&apos;s Bracket{showList ? "s" : ""}</Typography>
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && brackets.length === 0 && (
          <Typography color="text.secondary">{username} hasn&apos;t submitted picks yet.</Typography>
        )}
        {!loading && !error && showList && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {username} has {brackets.length} brackets. Select one to view:
            </Typography>
            <List>
              {brackets.map((b) => (
                <ListItemButton key={b.id} component={Link} href={`/bracket/${username}/${encodeURIComponent(b.bracket_name)}`}>
                  <ListItemText primary={b.bracket_name} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        )}
        {!loading && !error && !showList && viewPicks && regions && (
          <Bracket regions={regions} firstFour={firstFour} initialPicks={viewPicks} results={results} locked />
        )}
      </Container>
    </>
  );
}
