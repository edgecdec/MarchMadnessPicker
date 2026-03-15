"use client";
import { useState, useEffect } from "react";
import { Alert, Collapse, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const DISMISSED_KEY = "results_banner_dismissed_at";

export default function ResultsBanner() {
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tournaments/updates")
      .then((r) => r.json())
      .then(({ results_updated_at }) => {
        if (!results_updated_at) return;
        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed && dismissed >= results_updated_at) return;
        // Only show if updated within the last 24 hours
        const diff = Date.now() - new Date(results_updated_at + "Z").getTime();
        if (diff < 24 * 60 * 60 * 1000) {
          setUpdatedAt(results_updated_at);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!open) return null;

  const timeStr = new Date(updatedAt + "Z").toLocaleString();

  return (
    <Collapse in={open}>
      <Alert
        severity="info"
        action={
          <IconButton size="small" onClick={() => { setOpen(false); localStorage.setItem(DISMISSED_KEY, updatedAt!); }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ borderRadius: 0 }}
      >
        🏀 Results updated — {timeStr}
      </Alert>
    </Collapse>
  );
}
