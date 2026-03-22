# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Leaderboard emoji tooltips show region-seed IDs instead of team names and round**: Tooltips for emojis (e.g. shocked, hot streak) show raw identifiers like "West-11" instead of the actual team name and the round they advanced to. Fix: resolve region-seed to team name using bracket_data (e.g. "West-11" → "Texas") and include the round context (e.g. "Texas advanced to Sweet 16" or "Texas beat Gonzaga in R32"). Apply to all emoji tooltips that reference picks.
