import { getDb } from "@/lib/db";
import { autofillBracket } from "@/lib/autofill";
import { TOTAL_GAMES } from "@/lib/bracketData";
import { BracketData } from "@/types";

/**
 * Auto-fill incomplete brackets with Smart autofill after lock time.
 * Returns the number of brackets that were auto-filled.
 */
export function autoFillIncompleteBrackets(tournamentId: string): number {
  const db = getDb();
  const tournament = db.prepare("SELECT lock_time, bracket_data FROM tournaments WHERE id = ?").get(tournamentId) as any;
  if (!tournament?.lock_time || new Date(tournament.lock_time) > new Date()) return 0;

  const bracket: BracketData = JSON.parse(tournament.bracket_data || "{}");
  if (!bracket.regions?.length) return 0;

  const allPicks = db.prepare(
    "SELECT id, picks_data FROM picks WHERE tournament_id = ?"
  ).all(tournamentId) as { id: string; picks_data: string }[];

  let filled = 0;
  const update = db.prepare("UPDATE picks SET picks_data = ? WHERE id = ?");

  for (const row of allPicks) {
    const picks = JSON.parse(row.picks_data || "{}");
    const count = Object.keys(picks).length;
    if (count >= TOTAL_GAMES) continue;

    const completed = autofillBracket(bracket.regions, "smart", bracket.first_four, picks);
    update.run(JSON.stringify(completed), row.id);
    filled++;
  }

  return filled;
}
