"use client";
import { Dialog, DialogTitle, DialogContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, IconButton, Chip, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { PickDetail } from "@/lib/scoring";
import { getRoundName } from "@/lib/scoring";

interface Props {
  open: boolean;
  onClose: () => void;
  username: string;
  bracketName?: string | null;
  details: PickDetail[];
  filterRound?: number | null;
}

export default function ScoringBreakdownDialog({ open, onClose, username, bracketName, details, filterRound }: Props) {
  const decided = details.filter((d) => d.result !== null && (filterRound == null || d.round === filterRound));
  const correct = decided.filter((d) => d.correct);
  const totalBase = correct.reduce((s, d) => s + d.basePoints, 0);
  const totalBonus = correct.reduce((s, d) => s + d.upsetBonus, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{username}{bracketName ? ` — ${bracketName}` : ""}{filterRound != null ? ` — ${getRoundName(filterRound)}` : ""}</span>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Typography variant="body2">Correct: {correct.length}/{decided.length}</Typography>
          <Typography variant="body2">Base: {totalBase}</Typography>
          {totalBonus > 0 && <Typography variant="body2" color="warning.main">Upset Bonus: +{totalBonus}</Typography>}
          <Typography variant="body2" fontWeight="bold">Total: {totalBase + totalBonus}</Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Round</TableCell>
                <TableCell>Pick</TableCell>
                <TableCell>Result</TableCell>
                <TableCell align="right">Base</TableCell>
                <TableCell align="right">Bonus</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {decided.map((d) => (
                <TableRow key={d.gameId} sx={{ bgcolor: d.correct ? "success.main" : "error.main", "& td": { color: "common.white" } }}>
                  <TableCell>{getRoundName(d.round)}</TableCell>
                  <TableCell>{d.pick}</TableCell>
                  <TableCell>{d.correct ? "✓" : d.result}</TableCell>
                  <TableCell align="right">{d.correct ? d.basePoints : 0}</TableCell>
                  <TableCell align="right">{d.upsetBonus > 0 ? `+${d.upsetBonus}` : "—"}</TableCell>
                  <TableCell align="right">{d.correct ? d.basePoints + d.upsetBonus : 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
