import { Region, FirstFourGame } from "@/types";

// Bracket structure constants

// Standard NCAA bracket matchup order: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15
export const SEED_ORDER_PAIRS: [number, number][] = [
  [1, 16], [8, 9], [5, 12], [4, 13], [6, 11], [3, 14], [7, 10], [2, 15],
];

export const TOTAL_GAMES = 63; // 32+16+8+4+2+1

// Region accent colors — must be distinct from pick state colors (green=correct, red=wrong)
// Light mode originals (South changed from teal to red)
export const REGION_COLORS: Record<string, string> = {
  East: "#1565c0",
  West: "#8e24aa",
  South: "#c62828",
  Midwest: "#f9a825",
};
// Dark mode variants — WCAG AAA (≥7:1) against #121212
const REGION_COLORS_DARK: Record<string, string> = {
  East: "#64b5f6",
  West: "#ce93d8",
  South: "#ef9a9a",
  Midwest: "#ffd54f",
};
export function getRegionColor(name: string, mode: "dark" | "light"): string {
  return (mode === "dark" ? REGION_COLORS_DARK[name] : REGION_COLORS[name]) || "#9e9e9e";
}

// ESPN team IDs for logo URLs: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
const ESPN_TEAM_IDS: Record<string, number> = {
  "Duke": 150, "Alabama": 333, "Wisconsin": 275, "Arizona": 12, "Oregon": 2483,
  "BYU": 252, "St. Marys": 2608, "Saint Marys": 2608, "Mississippi St.": 344,
  "Baylor": 239, "Vanderbilt": 238, "VCU": 2670, "Liberty": 2335, "Akron": 2006,
  "Montana": 149, "Robert Morris": 2523, "American": 44, "Florida": 57,
  "St. Johns": 2599, "Texas Tech": 2641, "Maryland": 120, "Memphis": 235,
  "Missouri": 142, "Kansas": 2305, "UConn": 41, "Boise St.": 68, "Arkansas": 8,
  "Drake": 2181, "Colorado St.": 36, "Yale": 43, "Lipscomb": 288, "Omaha": 2350,
  "Norfolk St.": 2450, "Auburn": 2, "Michigan St.": 127, "Iowa St.": 66,
  "Iowa State": 66, "Texas A&M": 245, "Michigan": 130, "Ole Miss": 145,
  "Marquette": 269, "Louisville": 97, "Creighton": 156, "New Mexico": 167,
  "San Diego St.": 21, "UC San Diego": 5765, "Charleston": 2127, "Troy": 2653,
  "Bryant": 2803, "Alabama St.": 2011, "Houston": 248, "Tennessee": 2633,
  "Kentucky": 96, "Purdue": 2509, "Clemson": 228, "Illinois": 356, "UCLA": 26,
  "Gonzaga": 2250, "Georgia": 61, "Texas": 251, "NC State": 152, "McNeese": 2377,
  "High Point": 2272, "Wofford": 2747, "SIU Edwardsville": 2565, "SIUE": 2565,
  "North Carolina": 153, "Villanova": 222, "Syracuse": 183, "Indiana": 84,
  "Ohio St.": 194, "Ohio State": 194, "Iowa": 2294, "Virginia": 258,
  "Pittsburgh": 221, "West Virginia": 277, "Oklahoma": 201, "TCU": 2628,
  "Xavier": 2752, "Dayton": 2168, "Nevada": 2440, "Colorado": 38, "USC": 30,
  "Stanford": 24, "Georgetown": 46, "Providence": 2507, "Seton Hall": 2550,
  "Butler": 2086, "Cincinnati": 2132, "Rutgers": 164, "Penn St.": 213,
  "Minnesota": 135, "Northwestern": 77, "Nebraska": 158, "Wake Forest": 154,
  "Florida St.": 52, "Miami": 2390, "Virginia Tech": 259, "Georgia Tech": 59,
  "LSU": 99, "Mississippi": 145, "South Carolina": 2579, "Oklahoma St.": 197,
  "Kansas St.": 2306, "Washington": 264, "Oregon St.": 204, "Arizona St.": 9,
  "Utah": 254, "SMU": 2567, "Tulane": 2655, "North Texas": 249,
  "San Francisco": 2539, "Saint Louis": 139, "Davidson": 2166, "Richmond": 257,
  "George Mason": 2244, "Loyola Chicago": 2350, "Murray St.": 2413,
  "Vermont": 261, "Iona": 314, "Oral Roberts": 198, "Colgate": 2142,
  // 2026 field additions
  "UCF": 2116, "South Florida": 58, "Northern Iowa": 2460, "CA Baptist": 2856,
  "N Dakota St.": 2449, "Furman": 231, "Siena": 2561, "Utah State": 328,
  "Hawaii": 62, "Kennesaw St.": 338, "Queens": 2511, "Long Island": 112358,
  "Penn": 219, "Idaho": 70, "Prairie View": 2504, "Lehigh": 2329,
  "Santa Clara": 2541, "Hofstra": 2275, "Wright St.": 2750,
  "Tennessee St.": 2634, "UMBC": 2378, "Howard": 47, "Miami OH": 193,
};

export function getTeamLogoUrl(teamName: string): string | undefined {
  const id = ESPN_TEAM_IDS[teamName];
  return id ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png` : undefined;
}

const TEAM_ABBREVIATIONS: Record<string, string> = {
  "Lehigh": "LEH", "Prairie View": "PV", "NC State": "NCSU", "Texas": "TEX",
  "Howard": "HOW", "UMBC": "UMBC", "SMU": "SMU", "Miami OH": "M-OH",
  "Alabama St.": "ALST", "Robert Morris": "RMU", "Norfolk St.": "NFST",
  "Tennessee St.": "TNST", "SIU Edwardsville": "SIUE", "SIUE": "SIUE",
  "Wright St.": "WRST", "Hofstra": "HOF", "Santa Clara": "SCU",
  "Long Island": "LIU", "Queens": "QU", "Idaho": "IDHO", "Penn": "PENN",
  "Furman": "FUR", "Siena": "SIEN", "CA Baptist": "CBU", "N Dakota St.": "NDSU",
};

export function getTeamAbbreviation(teamName: string): string {
  return TEAM_ABBREVIATIONS[teamName] || teamName.slice(0, 4).toUpperCase();
}

// Generate a unique game ID for a First Four play-in game
export function ffGameId(game: { region: string; seed: number; slot: number }): string {
  return `ff-play-${game.region}-${game.seed}-${game.slot}`;
}

// Convert a team + region name to a region-seed identifier (e.g. "East-1")
export function toRegionSeed(regionName: string, seed: number): string {
  return `${regionName}-${seed}`;
}

// Parse a region-seed identifier back to { region, seed }
export function parseRegionSeed(rs: string): { region: string; seed: number } | null {
  const i = rs.lastIndexOf("-");
  if (i < 0) return null;
  const region = rs.slice(0, i);
  const seed = parseInt(rs.slice(i + 1));
  if (isNaN(seed)) return null;
  return { region, seed };
}

// Resolve a region-seed identifier to a display name using bracket data
// For First Four slots, uses the FF result if available, otherwise shows "TeamA/TeamB"
export function resolveRegionSeed(
  rs: string,
  regions: Region[],
  firstFour?: FirstFourGame[],
  ffResults?: Record<string, string>,
): string {
  const parsed = parseRegionSeed(rs);
  if (!parsed) return rs;
  const region = regions.find(r => r.name === parsed.region);
  if (!region) return rs;
  // Check if this seed is a First Four play-in slot
  if (firstFour) {
    const ff = firstFour.find(f => f.region === parsed.region && f.seed === parsed.seed);
    if (ff) {
      const gid = ffGameId(ff);
      const resolved = ffResults?.[gid];
      return resolved || `${ff.teamA}/${ff.teamB}`;
    }
  }
  const team = region.teams.find(t => t.seed === parsed.seed);
  return team?.name || rs;
}

// Get the region name for a team from bracket data
export function getTeamRegion(teamName: string, regions: Region[]): string | null {
  for (const r of regions) {
    if (r.teams.some(t => t.name === teamName)) return r.name;
  }
  return null;
}

// Historical NCAA tournament win rates by higher seed in matchup (1985–2024)
// Key: "higherSeed-lowerSeed", Value: win % for the higher (lower-numbered) seed
export const SEED_WIN_RATES: Record<string, number> = {
  "1-16": 99, "8-9": 51, "5-12": 64, "4-13": 79,
  "6-11": 63, "3-14": 85, "7-10": 61, "2-15": 94,
  "1-8": 79, "1-9": 86, "4-5": 55, "4-12": 70,
  "3-6": 58, "3-11": 70, "2-7": 64, "2-10": 74,
  "1-4": 68, "1-5": 76, "2-3": 55, "2-6": 64,
  "1-2": 52, "1-3": 60,
};
