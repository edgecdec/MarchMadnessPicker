# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Simulator "My Picks" autofill fills eliminated teams into future rounds**: When using "My Picks" on the simulator, it places teams from the user's bracket even if those teams have already been eliminated in actual results. Fix: before placing a pick as a hypothetical result, check if that team is still alive (not eliminated in results_data). If the team is eliminated, leave that game slot blank. This was reported before but never fixed — check the autofill logic in the simulator component.
