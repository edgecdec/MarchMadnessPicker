"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Button, TextField, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { DEFAULT_SCORING } from "@/types";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import ScoringEditor from "@/components/common/ScoringEditor";

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament } = useTournament();
  const [groups, setGroups] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scoringGroup, setScoringGroup] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [snack, setSnack] = useState("");

  useEffect(() => {
    if (user) api.groups.list().then((d) => setGroups(d.groups));
  }, [user]);

  useEffect(() => {
    if (selectedGroup && tournament) {
      api.groups.leaderboard(selectedGroup, tournament.id).then((d) => setLeaderboard(d.leaderboard));
    }
  }, [selectedGroup, tournament]);

  if (authLoading) return null;
  if (!user) return <AuthForm />;

  const createGroup = async () => {
    if (!newName.trim()) return;
    await api.groups.create(newName.trim());
    setNewName("");
    api.groups.list().then((d) => setGroups(d.groups));
  };

  const copyLink = (inviteCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
    setSnack("Invite link copied!");
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>My Groups</Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Create a Group</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField size="small" label="Group Name" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createGroup()} />
            <Button variant="contained" onClick={createGroup}>Create</Button>
          </Box>
        </Paper>

        {groups.length === 0 ? (
          <Typography color="text.secondary">You're not in any groups yet. Create one or join via an invite link!</Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {groups.map((g) => {
              const settings = typeof g.scoring_settings === "string" ? JSON.parse(g.scoring_settings) : g.scoring_settings;
              const isCreator = g.created_by === user.id;
              return (
                <Paper key={g.id} sx={{ p: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Box>
                      <Typography variant="h6">{g.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {g.member_count} member{g.member_count !== 1 ? "s" : ""} · Created by {g.creator_name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Button size="small" variant="outlined" onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}>
                        {selectedGroup === g.id ? "Hide" : "Leaderboard"}
                      </Button>
                      <Button size="small" variant="outlined" color="secondary" onClick={() => setScoringGroup(scoringGroup === g.id ? null : g.id)}>
                        {scoringGroup === g.id ? "Hide" : "Scoring"}
                      </Button>
                      <IconButton size="small" onClick={() => copyLink(g.invite_code)} title="Copy invite link">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {scoringGroup === g.id && (
                    <ScoringEditor
                      groupId={g.id}
                      initial={{ ...DEFAULT_SCORING, ...settings }}
                      isCreator={isCreator}
                    />
                  )}

                  {selectedGroup === g.id && (
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Player</TableCell>
                            <TableCell align="right">Score</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((entry, i) => (
                            <TableRow key={entry.username}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>{entry.username}</TableCell>
                              <TableCell align="right">{entry.score}</TableCell>
                              <TableCell align="right">{entry.has_picks ? "✅" : "⏳ No picks"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}

        <Snackbar open={!!snack} autoHideDuration={2000} onClose={() => setSnack("")}>
          <Alert severity="success" onClose={() => setSnack("")}>{snack}</Alert>
        </Snackbar>
      </Container>
    </>
  );
}
