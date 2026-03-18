// Centralized API client — all fetch calls go through here

import { User, Tournament, LeaderboardEntry, LiveGame, Group, ScoringSettings, UserBracket, GroupMessage } from "@/types";
import { PickDetail } from "@/lib/scoring";

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
      return request<{ tournaments: Tournament[]; userPicks: Record<string, string> | null; userBrackets: { id: string; bracket_name: string; submitted_at: string }[]; userTiebreaker: number | null; userVersion: number }>(`/api/picks?${params}`);
    },
    savePicks: (tournamentId: string, picks: Record<string, string>, bracketName?: string, tiebreaker?: number | null, version?: number) =>
      request<{ ok: boolean; version?: number }>("/api/picks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tournament_id: tournamentId, picks_data: picks, bracket_name: bracketName, tiebreaker, version }) }),
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
    whoPicked: (groupId: string, tournamentId: string) =>
      request<{ games: Record<string, Record<string, { count: number; users: { username: string; bracket_name: string | null }[] }>> }>(`/api/picks/whopicked?group_id=${groupId}&tournament_id=${tournamentId}`),
  },

  // Leaderboard
  leaderboard: {
    get: (tournamentId: string) => request<{ leaderboard: LeaderboardEntry[] }>(`/api/leaderboard?tournament_id=${tournamentId}`),
    breakdown: (tournamentId: string, username: string, bracketName?: string | null) => {
      const params = new URLSearchParams({ tournament_id: tournamentId, username });
      if (bracketName) params.set("bracket_name", bracketName);
      return request<{ details: PickDetail[]; settings: ScoringSettings }>(`/api/leaderboard/breakdown?${params}`);
    },
  },

  // Live Scores
  scores: {
    live: (date?: string) => request<{ games: LiveGame[] }>(date ? `/api/scores?date=${date}` : "/api/scores"),
  },

  // Groups
  groups: {
    list: () => request<{ groups: (Group & { member_count: number; creator_name: string })[]; assignments: { pick_id: string; group_id: string }[] }>("/api/groups"),
    getByInvite: (code: string) => request<{ group: Group & { member_count: number; is_member: boolean; creator_name: string } }>(`/api/groups?invite_code=${code}`),
    create: (name: string, maxBrackets?: number | null) =>
      request<{ id: string; invite_code: string }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", name, max_brackets: maxBrackets }) }),
    join: (inviteCode: string) =>
      request<{ group_id: string }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "join", invite_code: inviteCode }) }),
    updateScoring: (groupId: string, settings: ScoringSettings) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_scoring", group_id: groupId, scoring_settings: settings }) }),
    updateMaxBrackets: (groupId: string, maxBrackets: number | null) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_max_brackets", group_id: groupId, max_brackets: maxBrackets }) }),
    toggleSubmissionsLock: (groupId: string) =>
      request<{ ok: boolean; submissions_locked: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle_submissions_lock", group_id: groupId }) }),
    leaderboard: (groupId: string, tournamentId: string) =>
      request<{ group: Group; leaderboard: (LeaderboardEntry & { has_picks: boolean })[] }>(`/api/groups/${groupId}?tournament_id=${tournamentId}`),
    assignBracket: (pickId: string, groupId: string) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_bracket", pick_id: pickId, group_id: groupId }) }),
    unassignBracket: (pickId: string, groupId: string) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "unassign_bracket", pick_id: pickId, group_id: groupId }) }),
    removeBracket: (pickId: string, groupId: string) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_bracket", pick_id: pickId, group_id: groupId }) }),
    removeMember: (userId: string, groupId: string) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove_member", user_id: userId, group_id: groupId }) }),
    deleteGroup: (groupId: string) =>
      request<{ ok: boolean }>("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete_group", group_id: groupId }) }),
    messages: (groupId: string, before?: string) => {
      const params = before ? `?before=${before}` : "";
      return request<{ messages: GroupMessage[] }>(`/api/groups/${groupId}/messages${params}`);
    },
    sendMessage: (groupId: string, message: string) =>
      request<{ id: string; username: string; message: string }>(`/api/groups/${groupId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }),
  },

  // Simulate
  simulate: {
    get: (groupId: string, tournamentId: string) =>
      request<{ group: { id: string; name: string }; scoring: ScoringSettings; bracket: any; results: Record<string, string>; entries: { username: string; bracket_name: string | null; picks: Record<string, string>; tiebreaker: number | null }[] }>(`/api/simulate?group_id=${groupId}&tournament_id=${tournamentId}`),
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
    syncResults: () =>
      request<{ ok: boolean; updated: number; matched: string[]; unmatched: string[]; totalResults: number }>("/api/admin/sync-results", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }),
    searchUsers: (query: string) =>
      request<{ users: { id: string; username: string }[] }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "search_users", query }) }),
    getUserBrackets: (userId: string) =>
      request<{ brackets: { id: string; bracket_name: string; tournament_id: string }[] }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "get_user_brackets", user_id: userId }) }),
    addToGroup: (userId: string, groupId: string, pickIds?: string[]) =>
      request<{ ok: boolean }>("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "admin_add_to_group", user_id: userId, group_id: groupId, pick_ids: pickIds }) }),
  },

  // Auto-sync
  autoSync: () =>
    request<{ ok: boolean; updated: number; skipped?: boolean }>("/api/auto-sync", { method: "POST" }).catch(() => null),

  // Stats
  stats: {
    get: (tournamentId: string) =>
      request<{ stats: any }>(`/api/stats?tournament_id=${tournamentId}`),
  },

  // Profile
  profile: {
    get: (username: string) =>
      request<{ username: string; created_at: string; groups: { id: string; name: string; invite_code: string; member_count: number }[]; brackets: { id: string; bracket_name: string; submitted_at: string; tiebreaker: number | null; score: number; roundScores: number[] }[] }>(`/api/profile/${username}`),
  },
};
