"use client";
import { useState, useEffect } from "react";
import { Container, Typography, Box, Tabs, Tab, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "@/hooks/useAuth";
import { useTournament } from "@/hooks/useTournament";
import Navbar from "@/components/common/Navbar";
import Bracket from "@/components/bracket/Bracket";
import LiveScores from "@/components/bracket/LiveScores";
import AuthForm from "@/components/auth/AuthForm";
import CountdownTimer from "@/components/common/CountdownTimer";
import { api } from "@/lib/api";

export default function BracketPage() {
  const { user, loading: authLoading } = useAuth();
  const { tournament, regions, results, userPicks, userBrackets, activeBracket, loading: tournLoading, switchBracket, refreshBrackets } = useTournament();
  const [distribution, setDistribution] = useState<Record<string, Record<string, number>>>({});
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (tournament?.id && tournament.lock_time && new Date(tournament.lock_time) < new Date()) {
      api.tournaments.distribution(tournament.id).then(({ distribution }) => setDistribution(distribution)).catch(() => {});
    }
  }, [tournament]);

  if (authLoading || tournLoading) return null;
  if (!user) return <AuthForm />;

  if (!tournament) {
    return (
      <><Navbar /><Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="text.secondary">No tournament created yet. An admin needs to create one first.</Typography>
      </Container></>
    );
  }

  if (!regions) {
    return (
      <><Navbar /><Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
        <Typography color="text.secondary">The bracket hasn&apos;t been loaded yet. Check back after Selection Sunday!</Typography>
      </Container></>
    );
  }

  const locked = tournament.lock_time ? new Date(tournament.lock_time) < new Date() : false;

  const handleCreateBracket = async () => {
    const name = newName.trim();
    if (!name) return;
    await api.tournaments.savePicks(tournament.id, {}, name);
    setNewOpen(false);
    setNewName("");
    refreshBrackets();
    setTimeout(() => switchBracket(name), 200);
  };

  const handleRename = async () => {
    const name = renameName.trim();
    if (!name || !activeBracket) return;
    try {
      await api.tournaments.renameBracket(tournament.id, activeBracket, name);
      setRenameOpen(false);
      setRenameName("");
      refreshBrackets();
      setTimeout(() => switchBracket(name), 200);
    } catch {}
  };

  const handleDelete = async () => {
    if (!activeBracket) return;
    await api.tournaments.deleteBracket(tournament.id, activeBracket);
    setDeleteOpen(false);
    refreshBrackets();
  };

  const tabIndex = userBrackets.findIndex((b) => b.bracket_name === activeBracket);

  return (
    <>
      <Navbar />
      <Container maxWidth={false} sx={{ mt: 2, px: 2 }}>
        <Typography variant="h5" gutterBottom>{tournament.name}</Typography>
        <LiveScores />
        {tournament.lock_time && <CountdownTimer lockTime={tournament.lock_time} />}

        {/* Bracket selector */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          {userBrackets.length > 0 && (
            <Tabs
              value={tabIndex >= 0 ? tabIndex : 0}
              onChange={(_, idx) => switchBracket(userBrackets[idx].bracket_name)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flexGrow: 1 }}
            >
              {userBrackets.map((b) => (
                <Tab key={b.id} label={b.bracket_name} />
              ))}
            </Tabs>
          )}
          {!locked && (
            <>
              <IconButton size="small" onClick={() => setNewOpen(true)} title="New bracket"><AddIcon /></IconButton>
              {activeBracket && (
                <>
                  <IconButton size="small" onClick={() => { setRenameName(activeBracket); setRenameOpen(true); }} title="Rename bracket"><EditIcon /></IconButton>
                  {userBrackets.length > 1 && (
                    <IconButton size="small" onClick={() => setDeleteOpen(true)} title="Delete bracket" color="error"><DeleteIcon /></IconButton>
                  )}
                </>
              )}
            </>
          )}
        </Box>

        {userBrackets.length === 0 && !locked && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary" gutterBottom>You haven&apos;t created a bracket yet.</Typography>
            <Button variant="contained" onClick={() => { setNewName("My Bracket"); setNewOpen(true); }}>Create Your First Bracket</Button>
          </Box>
        )}

        {(userBrackets.length > 0 || locked) && (
          <Bracket
            regions={regions}
            tournamentId={tournament.id}
            initialPicks={userPicks}
            results={results}
            locked={locked}
            distribution={distribution}
            bracketName={activeBracket || undefined}
            onSaved={refreshBrackets}
          />
        )}
      </Container>

      {/* New bracket dialog */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)}>
        <DialogTitle>Create New Bracket</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Bracket Name" value={newName} onChange={(e) => setNewName(e.target.value)} sx={{ mt: 1 }} onKeyDown={(e) => e.key === "Enter" && handleCreateBracket()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBracket} variant="contained" disabled={!newName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
        <DialogTitle>Rename Bracket</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="New Name" value={renameName} onChange={(e) => setRenameName(e.target.value)} sx={{ mt: 1 }} onKeyDown={(e) => e.key === "Enter" && handleRename()} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!renameName.trim()}>Rename</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete Bracket?</DialogTitle>
        <DialogContent>
          <Typography>Delete &quot;{activeBracket}&quot;? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
