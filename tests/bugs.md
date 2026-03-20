# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **CRITICAL - ESPN sync missing "Saint Mary's" game (apostrophe issue again)**: Texas A&M beat Saint Mary's but the result isn't syncing. ESPN uses "Saint Mary's" (with apostrophe), our bracket has "Saint Marys" (without). The Hawai'i fix added an alias but didn't add one for Saint Mary's. Add `"saint mary's": "Saint Marys"` to ESPN_NAME_ALIASES. Also: the apostrophe-stripping fallback should have caught this — check why it didn't. After fixing, trigger sync to pick up this result and any others that may be stuck.

- **Simulation "Top Seeds" autofill produces impossible Final Four**: Filling top seeds gives Duke vs Florida in the semis which can't happen. Duke (#1) is East, Arizona (#2) is West, Michigan (#3) is Midwest, Florida (#4) is South. Left side = East vs South, Right side = West vs Midwest. The chalk autofill must respect the correct FF pairings.

- **Who Picked Whom shows raw game IDs like "ff-4-0"**: Replace with human-readable names: "ff-4-0" → "Final Four - East/South", "ff-4-1" → "Final Four - West/Midwest", "ff-5-0" → "Championship". For regional games, show "East - Round of 64 - Game 1" etc.

- **Simulation page should be locked for non-admins until brackets lock**: Show "Available after brackets lock" for non-admin users.

- **Monte Carlo should run 10000 simulations, update every 1000**: See @specs/simulator.md.

- **Simulator doesn't cascade-clear hypothetical results**: Changing an earlier round should remove the eliminated team from all later rounds, same as bracket edit page.

- **Simulator leaderboard should show tied ranks**: Same score = same rank (e.g. "T-1").

- **Simulator leaderboard should show score delta**: Show +/- delta from actual current score to simulated score.

- **Simulator: make leaderboard and Monte Carlo sections collapsible**: Add collapse/expand toggles. Default expanded. Remember state during session.
