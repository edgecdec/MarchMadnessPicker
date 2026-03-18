"use client";
import { useState, useEffect } from "react";
import { Container, Typography, TextField, Button, Box, Paper, CircularProgress, MenuItem, Select, InputLabel, FormControl, Autocomplete, Checkbox, FormControlLabel, Chip } from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Tournament, Group } from "@/types";
import Navbar from "@/components/common/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import PlanEditor from "@/components/common/PlanEditor";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [name, setName] = useState("NCAA Tournament");
  const [year, setYear] = useState("2026");
  const [lockTime, setLockTime] = useState("");
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [bracketJson, setBracketJson] = useState("");
  const [bracketMsg, setBracketMsg] = useState("");
  const [resultsJson, setResultsJson] = useState("");
  const [resultsMsg, setResultsMsg] = useState("");
  const [resultsTournament, setResultsTournament] = useState("");

  // Admin group management state
  const [groups, setGroups] = useState<(Group & { member_count: number })[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; username: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);
  const [userBrackets, setUserBrackets] = useState<{ id: string; bracket_name: string; tournament_id: string }[]>([]);
  const [selectedBrackets, setSelectedBrackets] = useState<string[]>([]);
  const [addMsg, setAddMsg] = useState("");

  useEffect(() => {
    api.tournaments.list().then(({ tournaments: t }) => {
      setTournaments(t);
      if (t.length) { setSelectedTournament(t[0].id); setResultsTournament(t[0].id); }
    }).catch(() => {});
    api.groups.list().then(({ groups: g }) => setGroups(g)).catch(() => {});
  }, []);

  if (loading) return null;
  if (!user) return <AuthForm />;
  if (!user.is_admin) { window.location.href = "/"; return null; }

  const createTournament = async () => {
    try {
      const data = await api.admin.createTournament(name, parseInt(year), lockTime || undefined);
      setMsg(`Tournament created: ${data.id}`);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const syncResults = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const data = await api.admin.syncResults();
      const parts = [`Updated ${data.updated} game(s). Total results: ${data.totalResults}.`];
      if (data.matched.length) parts.push(`Matched: ${data.matched.join(", ")}`);
      if (data.unmatched.length) parts.push(`Unmatched ESPN games: ${data.unmatched.join(", ")}`);
      setSyncMsg(parts.join("\n"));
    } catch (e: any) {
      setSyncMsg(`Error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const searchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setUserResults([]); return; }
    try {
      const { users } = await api.admin.searchUsers(query);
      setUserResults(users);
    } catch { setUserResults([]); }
  };

  const selectUser = async (u: { id: string; username: string } | null) => {
    setSelectedUser(u);
    setUserBrackets([]);
    setSelectedBrackets([]);
    if (u) {
      try {
        const { brackets } = await api.admin.getUserBrackets(u.id);
        setUserBrackets(brackets);
      } catch {}
    }
  };

  const addUserToGroup = async () => {
    if (!selectedUser || !selectedGroup) return;
    setAddMsg("");
    try {
      await api.admin.addToGroup(selectedUser.id, selectedGroup, selectedBrackets.length ? selectedBrackets : undefined);
      setAddMsg(`Added ${selectedUser.username} to group${selectedBrackets.length ? ` with ${selectedBrackets.length} bracket(s)` : ""}.`);
      setSelectedUser(null);
      setUserSearch("");
      setUserBrackets([]);
      setSelectedBrackets([]);
    } catch (e: any) { setAddMsg(`Error: ${e.message}`); }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Admin Panel</Typography>

        <Box sx={{ mb: 3 }}>
          <PlanEditor />
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Sync Results from ESPN</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Fetches completed NCAA tournament games from ESPN and auto-updates results. Handles First Four and all rounds.
          </Typography>
          <Button variant="contained" color="secondary" onClick={syncResults} disabled={syncing} startIcon={syncing ? <CircularProgress size={16} /> : undefined}>
            {syncing ? "Syncing..." : "Sync Results from ESPN"}
          </Button>
          {syncMsg && <Typography variant="body2" sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{syncMsg}</Typography>}
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Add Users & Brackets to Groups</Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Group</InputLabel>
            <Select value={selectedGroup} label="Group" onChange={e => setSelectedGroup(e.target.value)}>
              {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name} ({g.member_count} members)</MenuItem>)}
            </Select>
          </FormControl>
          <Autocomplete
            freeSolo
            options={userResults}
            getOptionLabel={o => typeof o === "string" ? o : o.username}
            inputValue={userSearch}
            onInputChange={(_, v) => searchUsers(v)}
            onChange={(_, v) => selectUser(typeof v === "string" ? null : v)}
            value={selectedUser}
            renderInput={params => <TextField {...params} label="Search user by username" />}
            sx={{ mb: 2 }}
          />
          {selectedUser && userBrackets.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Select brackets to assign:</Typography>
              {userBrackets.map(b => (
                <FormControlLabel key={b.id} control={
                  <Checkbox checked={selectedBrackets.includes(b.id)} onChange={e => {
                    setSelectedBrackets(prev => e.target.checked ? [...prev, b.id] : prev.filter(id => id !== b.id));
                  }} />
                } label={b.bracket_name} />
              ))}
            </Box>
          )}
          {selectedUser && userBrackets.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>This user has no brackets yet.</Typography>
          )}
          <Button variant="contained" disabled={!selectedUser || !selectedGroup} onClick={addUserToGroup}>
            Add to Group
          </Button>
          {addMsg && <Typography variant="body2" sx={{ mt: 2 }}>{addMsg}</Typography>}
        </Paper>

        {tournaments.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Import Bracket Data (JSON)</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tournament</InputLabel>
              <Select value={selectedTournament} label="Tournament" onChange={e => setSelectedTournament(e.target.value)}>
                {tournaments.map(t => <MenuItem key={t.id} value={t.id}>{t.name} ({t.year})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Bracket JSON" multiline minRows={4} maxRows={12} fullWidth value={bracketJson} onChange={e => setBracketJson(e.target.value)}
              helperText='Paste BracketData JSON: { "regions": [...], "first_four": [...] }' />
            <Button variant="contained" sx={{ mt: 2 }} disabled={!bracketJson.trim() || !selectedTournament} onClick={async () => {
              setBracketMsg("");
              try {
                const parsed = JSON.parse(bracketJson);
                await api.admin.updateBracket(selectedTournament, parsed);
                setBracketMsg("Bracket data updated successfully.");
              } catch (e: any) { setBracketMsg(`Error: ${e.message}`); }
            }}>Import Bracket Data</Button>
            {bracketMsg && <Typography variant="body2" sx={{ mt: 2 }}>{bracketMsg}</Typography>}
          </Paper>
        )}

        {tournaments.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Update Results Data (JSON)</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tournament</InputLabel>
              <Select value={resultsTournament} label="Tournament" onChange={e => setResultsTournament(e.target.value)}>
                {tournaments.map(t => <MenuItem key={t.id} value={t.id}>{t.name} ({t.year})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Results JSON" multiline minRows={4} maxRows={12} fullWidth value={resultsJson} onChange={e => setResultsJson(e.target.value)}
              helperText='Paste results JSON: { "East-0-0": "TeamName", "East-0-1": "TeamName", ... }' />
            <Button variant="contained" sx={{ mt: 2 }} disabled={!resultsJson.trim() || !resultsTournament} onClick={async () => {
              setResultsMsg("");
              try {
                const parsed = JSON.parse(resultsJson);
                await api.admin.updateResults(resultsTournament, parsed);
                setResultsMsg("Results data updated successfully.");
              } catch (e: any) { setResultsMsg(`Error: ${e.message}`); }
            }}>Update Results</Button>
            {resultsMsg && <Typography variant="body2" sx={{ mt: 2 }}>{resultsMsg}</Typography>}
          </Paper>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Create Tournament</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: 400 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} />
            <TextField label="Year" value={year} onChange={e => setYear(e.target.value)} />
            <TextField label="Lock Time (ISO)" value={lockTime} onChange={e => setLockTime(e.target.value)}
              helperText="Picks locked after this time. e.g. 2026-03-19T12:00:00Z" />
            <Button variant="contained" onClick={createTournament}>Create</Button>
            {msg && <Typography variant="body2" color="text.secondary">{msg}</Typography>}
          </Box>
        </Paper>
      </Container>
    </>
  );
}
