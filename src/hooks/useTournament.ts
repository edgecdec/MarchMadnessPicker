"use client";
import { useState, useEffect, useCallback } from "react";
import { Tournament, Region, FirstFourGame } from "@/types";
import { api } from "@/lib/api";

interface BracketInfo {
  id: string;
  bracket_name: string;
  submitted_at: string;
}

interface TournamentState {
  tournament: Tournament | null;
  regions: Region[] | null;
  firstFour: FirstFourGame[];
  results: Record<string, string>;
  userPicks: Record<string, string>;
  userBrackets: BracketInfo[];
  activeBracket: string | null;
  userTiebreaker: number | null;
  userVersion: number;
  loading: boolean;
}

export function useTournament() {
  const [state, setState] = useState<TournamentState>({
    tournament: null, regions: null, firstFour: [], results: {}, userPicks: {}, userBrackets: [], activeBracket: null, userTiebreaker: null, userVersion: 1, loading: true,
  });

  const loadBracket = useCallback((tournamentId: string, bracketName?: string) => {
    api.tournaments.getPicks(tournamentId, bracketName).then(({ userPicks, userBrackets, userTiebreaker, userVersion }) => {
      setState((s) => ({
        ...s,
        userPicks: userPicks || {},
        userBrackets: userBrackets || [],
        activeBracket: bracketName || userBrackets?.[0]?.bracket_name || null,
        userTiebreaker: userTiebreaker ?? null,
        userVersion: userVersion ?? 1,
      }));
    });
  }, []);

  useEffect(() => {
    api.tournaments.list().then(({ tournaments }) => {
      const t = tournaments[0];
      if (!t) { setState((s) => ({ ...s, loading: false })); return; }

      const bracket = typeof t.bracket_data === "string" ? JSON.parse(t.bracket_data) : t.bracket_data;
      const res = typeof t.results_data === "string" ? JSON.parse(t.results_data as string) : (t.results_data || {});

      api.tournaments.getPicks(t.id).then(({ userPicks, userBrackets, userTiebreaker, userVersion }) => {
        setState({
          tournament: t,
          regions: bracket?.regions || null,
          firstFour: bracket?.first_four || [],
          results: (res && Object.keys(res).length > 0) ? res : {},
          userPicks: userPicks || {},
          userBrackets: userBrackets || [],
          activeBracket: userBrackets?.[0]?.bracket_name || null,
          userTiebreaker: userTiebreaker ?? null,
          userVersion: userVersion ?? 1,
          loading: false,
        });
      });
    }).catch(() => setState((s) => ({ ...s, loading: false })));
  }, []);

  const switchBracket = useCallback((bracketName: string) => {
    if (!state.tournament) return;
    setState((s) => ({ ...s, activeBracket: bracketName }));
    loadBracket(state.tournament.id, bracketName);
  }, [state.tournament, loadBracket]);

  const refreshBrackets = useCallback(() => {
    if (!state.tournament) return;
    loadBracket(state.tournament.id, state.activeBracket || undefined);
  }, [state.tournament, state.activeBracket, loadBracket]);

  return { ...state, switchBracket, refreshBrackets };
}
