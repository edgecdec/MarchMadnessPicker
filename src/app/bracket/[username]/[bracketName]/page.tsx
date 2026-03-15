"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Typography } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import AuthForm from "@/components/auth/AuthForm";

export default function ViewSingleBracketPage() {
  const { username, bracketName } = useParams<{ username: string; bracketName: string }>();
  const decodedName = decodeURIComponent(bracketName);
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, firstFour, results, loading: tournLoading } = useTournament();
  const [viewPicks, setViewPicks] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournament || !username) return;
    api.tournaments.viewUser(username, tournament.id, decodedName)
      .then((d) => { setViewPicks(d.picks); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [tournament, username, decodedName]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>
          {username}&apos;s Bracket — {decodedName}
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && !viewPicks && (
          <Typography color="text.secondary">Bracket not found.</Typography>
        )}
        {!loading && !error && viewPicks && regions && (
          <Bracket regions={regions} firstFour={firstFour} initialPicks={viewPicks} results={results} locked />
        )}
      </Container>
    </>
  );
}
