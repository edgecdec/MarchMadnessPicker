"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Typography, Button, Paper, Box, List, ListItemButton, ListItemText, CircularProgress } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";

export default function JoinGroupPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [bracketPicker, setBracketPicker] = useState<{ brackets: any[]; groupId: string } | null>(null);

  useEffect(() => {
    if (!user || !code) return;
    api.groups.getByInvite(code)
      .then((d) => { setGroup(d.group); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [user, code]);

  const assignAndRedirect = async (groupId: string, brackets: any[], tournamentId: string) => {
    if (brackets.length === 0) {
      // Create empty bracket, save it, then assign
      await api.tournaments.savePicks(tournamentId, {}, "My Bracket");
      const { userBrackets } = await api.tournaments.getPicks(tournamentId, "My Bracket");
      const created = userBrackets.find((b) => b.bracket_name === "My Bracket");
      if (created) await api.groups.assignBracket(created.id, groupId);
      router.push("/bracket");
    } else if (brackets.length === 1) {
      await api.groups.assignBracket(brackets[0].id, groupId);
      router.push("/bracket");
    } else {
      setBracketPicker({ brackets, groupId });
      setJoining(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { group_id } = await api.groups.join(code);
      const { tournaments } = await api.tournaments.list();
      const t = tournaments[0];
      if (!t) { router.push("/groups"); return; }
      const { userBrackets } = await api.tournaments.getPicks(t.id);
      // Filter out brackets already assigned to this group
      const { assignments } = await api.groups.list();
      const assignedIds = new Set(assignments.filter((a) => a.group_id === group_id).map((a) => a.pick_id));
      const unassigned = userBrackets.filter((b) => !assignedIds.has(b.id));
      await assignAndRedirect(group_id, unassigned, t.id);
    } catch (e: any) {
      setError(e.message);
      setJoining(false);
    }
  };

  const handlePickBracket = async (bracketId: string) => {
    if (!bracketPicker) return;
    setJoining(true);
    try {
      await api.groups.assignBracket(bracketId, bracketPicker.groupId);
      router.push("/bracket");
    } catch (e: any) {
      setError(e.message);
      setJoining(false);
    }
  };

  if (authLoading) return null;
  if (!user) return <AuthForm />;
  if (loading) return null;

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        {error ? (
          <Typography color="error">{error}</Typography>
        ) : bracketPicker ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>Select a bracket for {group?.name}</Typography>
            <Typography color="text.secondary" gutterBottom>Choose which bracket to enter in this group</Typography>
            <List>
              {bracketPicker.brackets.map((b) => (
                <ListItemButton key={b.id} onClick={() => handlePickBracket(b.id)} disabled={joining}>
                  <ListItemText primary={b.bracket_name} />
                </ListItemButton>
              ))}
            </List>
            {joining && <CircularProgress size={24} sx={{ mt: 1 }} />}
          </Paper>
        ) : group && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h5" gutterBottom>🏀 {group.name}</Typography>
            <Typography color="text.secondary" gutterBottom>
              Created by {group.creator_name} · {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </Typography>
            {group.is_member ? (
              <Box sx={{ mt: 3 }}>
                <Typography color="success.main" gutterBottom>✅ You&apos;re in this group!</Typography>
                <Button variant="contained" href="/groups" sx={{ mt: 1 }}>View My Groups</Button>
              </Box>
            ) : (
              <Button variant="contained" size="large" onClick={handleJoin} disabled={joining} sx={{ mt: 3 }}>
                {joining ? <CircularProgress size={24} /> : "Join Group"}
              </Button>
            )}
          </Paper>
        )}
      </Container>
    </>
  );
}
