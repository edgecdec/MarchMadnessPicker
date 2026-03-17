"use client";
import { useEffect, useState } from "react";
import { Container, Typography, Button, TextField, Paper, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert, Link, Chip, Checkbox, FormControlLabel, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import { api } from "@/lib/api";
import { DEFAULT_SCORING } from "@/types";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import ScoringEditor from "@/components/common/ScoringEditor";
import GroupChat from "@/components/common/GroupChat";

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament } = useTournament();
  const [groups, setGroups] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ pick_id: string; group_id: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [scoringGroup, setScoringGroup] = useState<string | null>(null);
  const [bracketsGroup, setBracketsGroup] = useState<string | null>(null);
  const [chatGroup, setChatGroup] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [snack, setSnack] = useState("");
  const [snackSeverity, setSnackSeverity] = useState<"success" | "error">("success");
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
    setSnackSeverity("success");
    setSnack("Invite link copied!");
  };

  const isAssigned = (pickId: string, groupId: string) =>
    assignments.some((a) => a.pick_id === pickId && a.group_id === groupId);

  const toggleAssignment = async (pickId: string, groupId: string) => {
    try {
      if (isAssigned(pickId, groupId)) {
        await api.groups.unassignBracket(pickId, groupId);
      } else {
        await api.groups.assignBracket(pickId, groupId);
      }
      loadGroups();
    } catch (e: any) {
      setSnackSeverity("error");
      setSnack(e.message || "Failed to update bracket assignment");
    }
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
                      <Button size="small" variant="outlined" onClick={() => setChatGroup(chatGroup === g.id ? null : g.id)}>
                        {chatGroup === g.id ? "Hide" : "Chat"}
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
                      {g.max_brackets != null && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                          Max {g.max_brackets} bracket{g.max_brackets !== 1 ? "s" : ""} per member
                        </Typography>
                      )}
                      {!!g.submissions_locked && (
                        <Chip icon={<LockIcon />} label="Submissions locked by group admin" color="warning" size="small" sx={{ mb: 1 }} />
                      )}
                      {canEdit && (
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1 }}>
                          <TextField
                            size="small"
                            label="Max brackets per member"
                            type="number"
                            slotProps={{ htmlInput: { min: 1 } }}
                            defaultValue={g.max_brackets ?? ""}
                            placeholder="Unlimited"
                            sx={{ width: 200 }}
                            onBlur={async (e) => {
                              const val = e.target.value ? Number(e.target.value) : null;
                              await api.groups.updateMaxBrackets(g.id, val);
                              loadGroups();
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                const val = (e.target as HTMLInputElement).value ? Number((e.target as HTMLInputElement).value) : null;
                                await api.groups.updateMaxBrackets(g.id, val);
                                loadGroups();
                              }
                            }}
                          />
                          <Button
                            size="small"
                            variant={g.submissions_locked ? "contained" : "outlined"}
                            color={g.submissions_locked ? "warning" : "inherit"}
                            startIcon={g.submissions_locked ? <LockIcon /> : <LockOpenIcon />}
                            onClick={async () => {
                              await api.groups.toggleSubmissionsLock(g.id);
                              loadGroups();
                            }}
                          >
                            {g.submissions_locked ? "Unlock Submissions" : "Lock Submissions"}
                          </Button>
                        </Box>
                      )}
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

                  {chatGroup === g.id && (
                    <GroupChat groupId={g.id} currentUser={user.username} />
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
                            {canEdit && <TableCell align="right"></TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {leaderboard.map((entry, i) => (
                            <TableRow key={`${entry.username}-${entry.bracket_name || i}`}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell><Link href={`/bracket/${entry.username}`} underline="hover">{entry.username}</Link>{entry.busted && <Tooltip title={`Championship pick eliminated: ${entry.championPick}`}><span> 💀</span></Tooltip>}{entry.eliminated && <Tooltip title="Eliminated from contention — cannot catch the leader"><span> 🚫</span></Tooltip>}</TableCell>
                              <TableCell>{entry.bracket_name || "—"}</TableCell>
                              <TableCell align="right">{entry.score}</TableCell>
                              <TableCell align="right">{entry.score + (entry.maxRemaining ?? 0)}</TableCell>
                              <TableCell align="right">{entry.has_picks ? "✅" : "⏳ No picks"}</TableCell>
                              {canEdit && entry.pick_id && (
                                <TableCell align="right">
                                  <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}>
                                    <Tooltip title="Remove bracket from group">
                                      <IconButton size="small" color="error" onClick={async () => {
                                        if (!confirm(`Remove ${entry.username}'s bracket "${entry.bracket_name}" from this group?`)) return;
                                        try {
                                          await api.groups.removeBracket(entry.pick_id, g.id);
                                          const d = await api.groups.leaderboard(g.id, tournament!.id);
                                          setLeaderboard(d.leaderboard);
                                          setSnackSeverity("success");
                                          setSnack("Bracket removed from group");
                                        } catch (e: any) {
                                          setSnackSeverity("error");
                                          setSnack(e.message || "Failed to remove bracket");
                                        }
                                      }}>
                                        <RemoveCircleOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    {entry.user_id !== user.id && (
                                      <Tooltip title="Remove member from group">
                                        <IconButton size="small" color="error" onClick={async () => {
                                          if (!confirm(`Remove ${entry.username} from this group? This will also remove their bracket assignments.`)) return;
                                          try {
                                            await api.groups.removeMember(entry.user_id, g.id);
                                            const d = await api.groups.leaderboard(g.id, tournament!.id);
                                            setLeaderboard(d.leaderboard);
                                            loadGroups();
                                            setSnackSeverity("success");
                                            setSnack("Member removed from group");
                                          } catch (e: any) {
                                            setSnackSeverity("error");
                                            setSnack(e.message || "Failed to remove member");
                                          }
                                        }}>
                                          <PersonRemoveIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </TableCell>
                              )}
                              {canEdit && !entry.pick_id && (
                                <TableCell align="right">
                                  {entry.user_id !== user.id && (
                                    <Tooltip title="Remove member from group">
                                      <IconButton size="small" color="error" onClick={async () => {
                                        if (!confirm(`Remove ${entry.username} from this group?`)) return;
                                        try {
                                          await api.groups.removeMember(entry.user_id, g.id);
                                          const d = await api.groups.leaderboard(g.id, tournament!.id);
                                          setLeaderboard(d.leaderboard);
                                          loadGroups();
                                          setSnackSeverity("success");
                                          setSnack("Member removed from group");
                                        } catch (e: any) {
                                          setSnackSeverity("error");
                                          setSnack(e.message || "Failed to remove member");
                                        }
                                      }}>
                                        <PersonRemoveIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              )}
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
          <Alert severity={snackSeverity} onClose={() => setSnack("")}>{snack}</Alert>
        </Snackbar>
      </Container>
    </>
  );
}
