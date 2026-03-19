# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **Leaderboard tiebreaking shows arbitrary order instead of tied ranks**: When two brackets have the same score, they should show the same rank (e.g. both show "#1" not "#1" and "#2"). Currently it appears to break ties by submission time, which is unfair. Fix: when sorting the leaderboard, assign the same rank number to all brackets with the same score. Use the tiebreaker value (championship total score prediction) as the secondary sort ONLY when actual championship results are available to compare against. Before the championship game, tied scores should show the same rank. Display as "T-1" or "1 (tied)" to make it clear.
