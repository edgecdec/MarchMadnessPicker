"use client";
import { useState, useEffect } from "react";
import { Alert, Button } from "@mui/material";
import { TOTAL_GAMES } from "@/lib/bracketData";

interface Props {
  lockTime: string | null;
  picks: Record<string, string>;
  bracketName?: string | null;
}

export default function PickReminderBanner({ lockTime, picks, bracketName }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  if (!lockTime) return null;
  const ms = new Date(lockTime).getTime() - now;
  if (ms <= 0 || ms > 86400000) return null; // only show within 24h

  const pickCount = Object.keys(picks).filter((k) => !k.startsWith("ff-")).length;
  if (pickCount >= TOTAL_GAMES) return null;

  const remaining = TOTAL_GAMES - pickCount;
  const hours = Math.floor(ms / 3600000);
  const urgent = ms < 3600000;

  return (
    <Alert
      severity={urgent ? "error" : "warning"}
      sx={{ mb: 2 }}
      action={<Button color="inherit" size="small" href="/bracket">Complete Picks</Button>}
    >
      {bracketName ? `"${bracketName}" has` : "Your bracket has"} {remaining} empty {remaining === 1 ? "slot" : "slots"} — picks lock in {hours > 0 ? `${hours}h` : "less than 1h"}!
    </Alert>
  );
}
