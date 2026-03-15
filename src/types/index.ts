// Shared types used across client and server

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export interface Team {
  seed: number;
  name: string;
}

export interface Region {
  name: string;
  teams: Team[];
}

export interface Tournament {
  id: string;
  name: string;
  year: number;
  lock_time: string | null;
  bracket_data: string | BracketData;
  results_data: string | Record<string, string>;
}

export interface BracketData {
  regions: Region[];
}

export interface GameScore {
  teamA?: string;
  teamB?: string;
  state?: "pre" | "in" | "post";
  detail?: string;
}

export interface LeaderboardEntry {
  username: string;
  score: number;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

export interface LiveGame {
  id: string;
  name: string;
  status: string;
  detail: string;
  state: string;
  clock: string;
  period: number;
  home: { name: string; score: string; logo: string };
  away: { name: string; score: string; logo: string };
  broadcast: string;
}
