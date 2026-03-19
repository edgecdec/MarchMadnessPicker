# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **URGENT - ESPN sync can't match "Hawai'i" — game results not syncing**: The auto-sync endpoint returns `"unmatched":["Arkansas vs Hawai'i"]` because ESPN uses "Hawai'i" (with apostrophe) but our bracket_data has "Hawaii" (without). Add `"hawai'i": "Hawaii"` to the ESPN_NAME_ALIASES map in src/lib/espnSync.ts. Also add a fallback in matchEspnName that strips apostrophes/special chars before matching. Check for any other teams that might have similar issues (e.g. teams with periods, apostrophes, or accents in ESPN names). After fixing, trigger a sync to pick up the Arkansas result and any other missed games.

- **Leaderboard tiebreaking shows arbitrary order instead of tied ranks**: When two brackets have the same score, they should show the same rank (e.g. both show "#1" not "#1" and "#2"). Currently it appears to break ties by submission time, which is unfair. Fix: when sorting the leaderboard, assign the same rank number to all brackets with the same score. Use the tiebreaker value (championship total score prediction) as the secondary sort ONLY when actual championship results are available to compare against. Before the championship game, tied scores should show the same rank. Display as "T-1" or "1 (tied)" to make it clear.
