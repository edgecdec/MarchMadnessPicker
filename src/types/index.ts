// Shared types used across client and server

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export interface Team {
  seed: number;
  name: string;
  logo?: string;
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

export interface FirstFourGame {
  region: string;       // region name, e.g. "East"
  seed: number;         // the seed being played in (11 or 16)
  slot: number;         // R64 matchup index this feeds into
  teamA: string;
  teamB: string;
}

export interface BracketData {
  regions: Region[];
  first_four?: FirstFourGame[];
}

export interface GameScore {
  teamA?: string;
  teamB?: string;
  state?: "pre" | "in" | "post";
  detail?: string;
}

export interface LeaderboardEntry {
  username: string;
  bracket_name?: string;
  score: number;
  maxRemaining?: number;
  tiebreaker?: number | null;
  roundScores?: number[];
  bestPossibleFinish?: number;
  championPick?: string | null;
  busted?: boolean;
}

export interface ScoringSettings {
  pointsPerRound: number[];      // [R64, R32, S16, E8, FF, Champ]
  upsetBonusPerRound: number[];  // bonus multiplied by (winner_seed - loser_seed) for upsets
}

export const DEFAULT_SCORING: ScoringSettings = {
  pointsPerRound: [1, 2, 4, 8, 16, 32],
  upsetBonusPerRound: [0, 0, 0, 0, 0, 0],
};

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  scoring_settings: string | ScoringSettings;
  max_brackets: number | null;
}

export interface UserBracket {
  id: string;
  bracket_name: string;
  picks_data: Record<string, string>;
  submitted_at: string;
  tiebreaker?: number | null;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  message: string;
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
