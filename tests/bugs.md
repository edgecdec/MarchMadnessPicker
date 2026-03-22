# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Simulator "My Picks" autofill fills eliminated teams into future rounds**: When using "My Picks" on the simulator, it places teams from the user's bracket even if those teams have already been eliminated in actual results. Fix: before placing a pick as a hypothetical result, check if that team is still alive (not eliminated in results_data). If the team is eliminated, leave that game slot blank. This was reported before but never fixed — check the autofill logic in the simulator component.

- **Leaderboard emoji tooltips show region-seed IDs instead of team names and round**: Tooltips for emojis (e.g. shocked, hot streak) show raw identifiers like "West-11" instead of the actual team name and the round they advanced to. Fix: resolve region-seed to team name using bracket_data (e.g. "West-11" → "Texas") and include the round context (e.g. "Texas advanced to Sweet 16" or "Texas beat Gonzaga in R32"). Apply to all emoji tooltips that reference picks.
