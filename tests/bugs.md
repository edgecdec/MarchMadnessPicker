# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Show count next to shocked emoji**: The 😱 emoji should show a number indicating how many rare correct picks (≤5% of brackets) the user has, e.g. "😱3" means 3 such picks. The threshold change to 5% is already done — just add the count display.

- **Simulator "My Picks" autofill fills eliminated teams into future rounds**: When using "My Picks" on the simulator, it places teams from the user's bracket even if those teams have already been eliminated in actual results. Fix: before placing a pick as a hypothetical result, check if that team is still alive (not eliminated in results_data). If the team is eliminated, leave that game slot blank. This was reported before but never fixed — check the autofill logic in the simulator component.
