"use client";
import { useState, useEffect } from "react";
import { LiveGame } from "@/types";
import { api } from "@/lib/api";

export function useLiveScores(refreshInterval = 30000) {
  const [games, setGames] = useState<LiveGame[]>([]);

  useEffect(() => {
    const load = () => api.scores.live().then((d) => setGames(d.games)).catch(() => {});
    load();
    const interval = setInterval(load, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return games;
}
