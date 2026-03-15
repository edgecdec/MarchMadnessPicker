"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Typography, Button, Paper, Box } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

export default function JoinGroupPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !code) return;
    api.groups.getByInvite(code)
      .then((d) => { setGroup(d.group); setJoined(d.group.is_member); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [user, code]);

  if (authLoading) return null;
  if (!user) return <AuthForm />;
  if (loading) return null;

  const handleJoin = async () => {
    try {
      await api.groups.join(code);
      setJoined(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : group && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>🏀 {group.name}</Typography>
            <Typography color="text.secondary" gutterBottom>
              Created by {group.creator_name} · {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </Typography>
            {joined ? (
              <Box sx={{ mt: 3 }}>
                <Typography color="success.main" gutterBottom>✅ You're in this group!</Typography>
                <Button variant="contained" href="/groups" sx={{ mt: 1 }}>View My Groups</Button>
              </Box>
            ) : (
              <Button variant="contained" size="large" onClick={handleJoin} sx={{ mt: 3 }}>Join Group</Button>
            )}
          </Paper>
        )}
      </Container>
    </>
  );
}
