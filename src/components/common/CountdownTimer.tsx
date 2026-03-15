"use client";
import { useState, useEffect } from "react";
import { Typography } from "@mui/material";

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return "";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export default function CountdownTimer({ lockTime }: { lockTime: string }) {
  const [timeLeft, setTimeLeft] = useState(() => new Date(lockTime).getTime() - Date.now());

  useEffect(() => {
    if (timeLeft <= 0) return;
    const id = setInterval(() => {
      const remaining = new Date(lockTime).getTime() - Date.now();
      setTimeLeft(remaining <= 0 ? 0 : remaining);
    }, 1000);
    return () => clearInterval(id);
  }, [lockTime, timeLeft <= 0]);

  if (timeLeft <= 0) return null;

  return (
    <Typography variant="body2" sx={{ color: timeLeft < 3600000 ? "error.main" : "warning.main", fontWeight: 600 }}>
      ⏰ Picks lock in {formatTimeLeft(timeLeft)}
    </Typography>
  );
}
