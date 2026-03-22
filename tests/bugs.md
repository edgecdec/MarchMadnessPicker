# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Change shocked emoji threshold from "only one" to 5% or less**: The 😱 shocked emoji currently shows when a user is the only person to get a specific pick correct. Change it to show when the user got a pick correct that 5% or fewer of all brackets predicted. This makes it more meaningful in larger pools.

- **Simulator "My Picks" autofill fills eliminated teams into future rounds**: When using "My Picks" on the simulator, it places teams from the user's bracket even if those teams have already been eliminated in actual results. Fix: before placing a pick as a hypothetical result, check if that team is still alive (not eliminated in results_data). If the team is eliminated, leave that game slot blank. This was reported before but never fixed — check the autofill logic in the simulator component.
