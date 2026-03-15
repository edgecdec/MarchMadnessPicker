// 2025 NCAA Tournament bracket data
// Each region has 16 teams seeded 1-16
// Matchups: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15

export interface Team {
  seed: number;
  name: string;
}

export interface Game {
  id: string;       // e.g. "east-0-0" = region-round-gameIndex
  round: number;    // 0=R64, 1=R32, 2=S16, 3=E8, 4=FF, 5=Championship
  teamA?: Team;     // top team (from bracket or previous pick)
  teamB?: Team;     // bottom team
  winner?: string;  // team name picked by user
}

export interface Region {
  name: string;
  teams: Team[];
}

export const ROUND_NAMES = ["Round of 64", "Round of 32", "Sweet 16", "Elite 8", "Final Four", "Championship"];
export const POINTS_PER_ROUND = [1, 2, 4, 8, 16, 32];

// Standard bracket order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
const SEED_ORDER = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];

export function getInitialGames(region: Region): Game[] {
  const games: Game[] = [];
  // Round of 64: 8 games
  for (let i = 0; i < 8; i++) {
    games.push({
      id: `${region.name}-0-${i}`,
      round: 0,
      teamA: region.teams.find(t => t.seed === SEED_ORDER[i * 2]),
      teamB: region.teams.find(t => t.seed === SEED_ORDER[i * 2 + 1]),
    });
  }
  // Rounds 1-3: empty games that get filled by picks
  for (let round = 1; round <= 3; round++) {
    const count = 8 / Math.pow(2, round);
    for (let i = 0; i < count; i++) {
      games.push({ id: `${region.name}-${round}-${i}`, round });
    }
  }
  return games;
}

export const REGIONS_2025: Region[] = [
  {
    name: "East",
    teams: [
      { seed: 1, name: "Duke" },
      { seed: 2, name: "Alabama" },
      { seed: 3, name: "Wisconsin" },
      { seed: 4, name: "Arizona" },
      { seed: 5, name: "Oregon" },
      { seed: 6, name: "BYU" },
      { seed: 7, name: "St. Mary's" },
      { seed: 8, name: "Mississippi St." },
      { seed: 9, name: "Baylor" },
      { seed: 10, name: "Vanderbilt" },
      { seed: 11, name: "VCU" },
      { seed: 12, name: "Liberty" },
      { seed: 13, name: "Akron" },
      { seed: 14, name: "Montana" },
      { seed: 15, name: "Robert Morris" },
      { seed: 16, name: "American" },
    ],
  },
  {
    name: "West",
    teams: [
      { seed: 1, name: "Florida" },
      { seed: 2, name: "St. John's" },
      { seed: 3, name: "Texas Tech" },
      { seed: 4, name: "Maryland" },
      { seed: 5, name: "Memph is" },
      { seed: 6, name: "Missouri" },
      { seed: 7, name: "Kansas" },
      { seed: 8, name: "UConn" },
      { seed: 9, name: "Boise St." },
      { seed: 10, name: "Arkansas" },
      { seed: 11, name: "Drake" },
      { seed: 12, name: "Colorado St." },
      { seed: 13, name: "Yale" },
      { seed: 14, name: "Lipscomb" },
      { seed: 15, name: "Omaha" },
      { seed: 16, name: "Norfolk St." },
    ],
  },
  {
    name: "South",
    teams: [
      { seed: 1, name: "Auburn" },
      { seed: 2, name: "Michigan St." },
      { seed: 3, name: "Iowa St." },
      { seed: 4, name: "Texas A&M" },
      { seed: 5, name: "Michigan" },
      { seed: 6, name: "Ole Miss" },
      { seed: 7, name: "Marquette" },
      { seed: 8, name: "Louisville" },
      { seed: 9, name: "Creighton" },
      { seed: 10, name: "New Mexico" },
      { seed: 11, name: "San Diego St." },
      { seed: 12, name: "UC San Diego" },
      { seed: 13, name: "Charleston" },
      { seed: 14, name: "Troy" },
      { seed: 15, name: "Bryant" },
      { seed: 16, name: "Alabama St." },
    ],
  },
  {
    name: "Midwest",
    teams: [
      { seed: 1, name: "Houston" },
      { seed: 2, name: "Tennessee" },
      { seed: 3, name: "Kentucky" },
      { seed: 4, name: "Purdue" },
      { seed: 5, name: "Clemson" },
      { seed: 6, name: "Illinois" },
      { seed: 7, name: "UCLA" },
      { seed: 8, name: "Gonzaga" },
      { seed: 9, name: "Georgia" },
      { seed: 10, name: "Texas" },
      { seed: 11, name: "NC State" },
      { seed: 12, name: "McNeese" },
      { seed: 13, name: "High Point" },
      { seed: 14, name: "Wofford" },
      { seed: 15, name: "SIU Edwardsville" },
      { seed: 16, name: "SIUE" },
    ],
  },
];

export const BRACKET_2025 = {
  regions: REGIONS_2025,
  year: 2025,
  name: "NCAA Tournament 2025",
};
