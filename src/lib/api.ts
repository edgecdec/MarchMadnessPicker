// Centralized API client — all fetch calls go through here

import { User, Tournament, LeaderboardEntry, LiveGame, Group, ScoringSettings, UserBracket } from "@/types";

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export const api = {
  auth: {
    me: () => request<{ user: User | null }>("/api/auth"),
    login: (username: string, password: string) =>
      request<User>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "login", username, password }) }),
    register: (username: string, password: string) =>
      request<User>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "register", username, password }) }),
    logout: () =>
      request<{ ok: boolean }>("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }),
  },

  // Tournaments & Picks
  tournaments: {
    list: () => request<{ tournaments: Tournament[] }>("/api/picks"),
    getPicks: (tournamentId: string, bracketName?: string) => {
      const params = new URLSearchParams({ tournament_id: tournamentId });
      if (bracketName) params.set("bracket_name", bracketName);
      return request<{ tournaments: Tournament[]; userPicks: Record<string, string> | null; userBrackets: { id: string; bracket_name: string; submitted_at: string }[] }>(`/api/picks?${params}`);
    },
    savePicks: (tournamentId: string, picks: Record<string, string>, bracketName?: string) =>
      request<{ ok: boolean }>("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks, bracket_name: bracketName }) }),
    deleteBracket: (tournamentId: string, bracketName: string) =>
      request<{ ok: boolean }>("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tournament_id: tournamentId, bracket_name: bracketName, action: "delete_bracket" }) }),
    renameBracket: (tournamentId: string, bracketName: string, newName: string) =>
      request<{ ok: boolean }>("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tournament_id: tournamentId, bracket_name: bracketName, new_name: newName, action: "rename_bracket" }) }),
    viewUser: (username: string, tournamentId: string, bracketName?: string) => {
      const params = new URLSearchParams({ tournament_id: tournamentId });
      if (bracketName) params.set("bracket_name", bracketName);
      return request<{ username: string; picks: Record<string, string> | null; brackets: { id: string; bracket_name: string; submitted_at: string }[] }>(`/api/picks/${username}?${params}`);
    },
    distribution: (tournamentId: string) =>
      request<{ distribution: Record<string, Record<string, number>> }>(`/api/picks/distribution?tournament_id=${tournamentId}`),
  },

  // Leaderboard
  leaderboard: {
    get: (tournamentId: string) => request<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard?tournament_id=${tournamentId}`),
  },

  // Live Scores
  scores: {
    live: (date?: string) => request<{ games: LiveGame[] }>(date ? `/api/scores?date=${date}` : "/api/scores"),
  },

  // Groups
  groups: {
    list: () => request<{ groups: (Group & { member_count: number; creator_name: string })[] }>("/api/groups"),
    getByInvite: (code: string) => request<{ group: Group & { member_count: number; is_member: boolean; creator_name: string } }>(`/api/groups?invite_code=${code}`),
    create: (name: string) =>
      request<{ id: string; invite_code: string }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name }) }),
    join: (inviteCode: string) =>
      request<{ group_id: string }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", invite_code: inviteCode }) }),
    updateScoring: (groupId: string, settings: ScoringSettings) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_scoring", group_id: groupId, scoring_settings: settings }) }),
    leaderboard: (groupId: string, tournamentId: string) =>
      request<{ group: Group; leaderboard: (LeaderboardEntry & { has_picks: boolean })[] }>(`/api/groups/${groupId}?tournament_id=${tournamentId}`),
  },

  // Admin
  admin: {
    createTournament: (name: string, year: number, lockTime?: string, bracketData?: any) =>
      request<{ id: string }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_tournament", name, year, lock_time: lockTime, bracket_data: bracketData }) }),
    updateBracket: (tournamentId: string, bracketData: any) =>
      request<{ ok: boolean }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_bracket", tournament_id: tournamentId, bracket_data: bracketData }) }),
    updateResults: (tournamentId: string, resultsData: Record<string, string>) =>
      request<{ ok: boolean }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_results", tournament_id: tournamentId, results_data: resultsData }) }),
    getPlan: () => request<{ tasks: { text: string; done: boolean }[] }>("/api/admin/plan"),
    savePlan: (tasks: { text: string; done: boolean }[]) =>
      request<{ ok: boolean }>("/api/admin/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tasks }) }),
  },
};
