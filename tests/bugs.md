# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Best Position: show N/A until Sweet 16, then brute force**: The Best Possible Finish calculation has bugs. Change it to show "N/A" when there are more than 15 games remaining. Once the tournament reaches the Sweet 16 and beyond (15 or fewer games left), brute force calculate the true best position using the per-region enumeration approach (2^remaining_games is feasible at ≤15 games = 32768 max). This avoids the buggy approximation for early rounds and gives accurate results when it matters most.
