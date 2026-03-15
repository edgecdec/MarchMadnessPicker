"use client";
import { useState, useEffect } from "react";
import { Tournament, Region } from "@/types";
import { api } from "@/lib/api";

interface TournamentState {
  tournament: Tournament | null;
  regions: Region[] | null;
  results: Record<string, string>;
  userPicks: Record<string, string>;
  loading: boolean;
}

export function useTournament() {
  const [state, setState] = useState<TournamentState>({
    tournament: null, regions: null, results: {}, userPicks: {}, loading: true,
  });

  useEffect(() => {
    api.tournaments.list().then(({ tournaments }) => {
      const t = tournaments[0];
      if (!t) { setState((s) => ({ ...s, loading: false })); return; }

      const bracket = typeof t.bracket_data === "string" ? JSON.parse(t.bracket_data) : t.bracket_data;
      const res = typeof t.results_data === "string" ? JSON.parse(t.results_data as string) : (t.results_data || {});

      api.tournaments.getPicks(t.id).then(({ userPicks }) => {
        setState({
          tournament: t,
          regions: bracket?.regions || null,
          results: (res && Object.keys(res).length > 0) ? res : {},
          userPicks: userPicks || {},
          loading: false,
        });
      });
    }).catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  return state;
}
