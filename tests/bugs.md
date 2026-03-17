# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Simulator: truncate player names so all 3 stat columns are visible**: The player name column is too wide, pushing Avg Score / Avg Place / Win % off screen. Truncate or abbreviate player names (e.g. max 12 chars with ellipsis) so all 3 stat columns are always visible without horizontal scrolling.

- **Simulator: hide results until brackets are locked (except for admins)**: The Monte Carlo simulation results (avg score, avg place, win %) reveal information about other users' brackets before lock time. Gate the results table behind the tournament lock check — before lock, show "Simulation results available after brackets lock" for non-admin users. Admins can see results anytime. Use the shared isTournamentLocked() utility.

- **Simulator: sort by Win % descending and show 1 decimal precision**: Default sort should be Win % descending (not ascending). Round all stats to 1 decimal place (e.g. "12.3%" not "12%", "4.7" not "5" for avg place). Apply to both the default sort and when clicking the Win % column header.

- **Simulator: add "Top Seeds" and "My Picks" autofill buttons for hypothetical results**: Add buttons above the bracket: "Top Seeds" fills all remaining unresolved games with the higher seed winning (chalk). "My Picks" fills remaining games with the current user's bracket picks — if the user has multiple brackets in the selected group, show a dropdown to pick which bracket to use. These set hypothetical results on the simulator bracket and trigger a recalculation of the Monte Carlo stats.
