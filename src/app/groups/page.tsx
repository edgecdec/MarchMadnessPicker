"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Button, TextField, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert, Link, Chip, Checkbox, FormControlLabel } from "@mui/material";
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
  const [assignments, setAssignments] = useState<{ pick_id: string; group_id: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scoringGroup, setScoringGroup] = useState<string | null>(null);
  const [bracketsGroup, setBracketsGroup] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [snack, setSnack] = useState("");
  const { userBrackets } = useTournament();

  const loadGroups = () => {
    api.groups.list().then((d) => {
      setGroups(d.groups);
      setAssignments(d.assignments);
    });
  };

  useEffect(() => {
    if (user) loadGroups();
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
    loadGroups();
  };

  const copyLink = (inviteCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${inviteCode}`);
    setSnack("Invite link copied!");
  };

  const isAssigned = (pickId: string, groupId: string) =>
    assignments.some((a) => a.pick_id === pickId && a.group_id === groupId);

  const toggleAssignment = async (pickId: string, groupId: string) => {
    if (isAssigned(pickId, groupId)) {
      await api.groups.unassignBracket(pickId, groupId);
    } else {
      await api.groups.assignBracket(pickId, groupId);
    }
    loadGroups();
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
              const canEdit = g.id === "everyone" ? user.is_admin : isCreator;
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
                      <Button size="small" variant="outlined" onClick={() => setBracketsGroup(bracketsGroup === g.id ? null : g.id)}>
                        {bracketsGroup === g.id ? "Hide" : "Brackets"}
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
                      canEdit={canEdit}
                    />
                  )}

                  {bracketsGroup === g.id && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: "action.hover", borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>Enter brackets in this group:</Typography>
                      {userBrackets.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">No brackets yet. Create one on the Bracket page.</Typography>
                      ) : (
                        userBrackets.map((b) => (
                          <FormControlLabel
                            key={b.id}
                            control={
                              <Checkbox
                                checked={isAssigned(b.id, g.id)}
                                onChange={() => toggleAssignment(b.id, g.id)}
                                size="small"
                              />
                            }
                            label={b.bracket_name}
                          />
                        ))
                      )}
                    </Box>
                  )}

                  {selectedGroup === g.id && (
                    <TableContainer sx={{ mt: 1 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Rank</TableCell>
                            <TableCell>Player</TableCell>
                            <TableCell>Bracket</TableCell>
                            <TableCell align="right">Score</TableCell>
                            <TableCell align="right">Max Possible</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((entry, i) => (
                            <TableRow key={`${entry.username}-${entry.bracket_name || i}`}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell><Link href={`/bracket/${entry.username}`} underline="hover">{entry.username}</Link></TableCell>
                              <TableCell>{entry.bracket_name || "—"}</TableCell>
                              <TableCell align="right">{entry.score}</TableCell>
                              <TableCell align="right">{entry.score + (entry.maxRemaining ?? 0)}</TableCell>
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
