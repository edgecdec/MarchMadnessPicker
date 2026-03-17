# Bugs — Fix these BEFORE working on any PLAN.md tasks












- **Leaderboard hover reveals other users' Final Four picks before lock**: Hovering on a bracket row on the leaderboard shows the user's Final Four picks even though brackets aren't locked yet. This lets people copy picks. Fix: create a shared utility function `isTournamentLocked(lockTime: string): boolean` in src/lib/ that checks if the current time is past lock_time. Use this EVERYWHERE that displays other users' picks — leaderboard hover tooltips, bracket view pages, profile pages, comparison views, distribution stats, who-picked-whom, etc. Before lock: hide all other users' pick details (show "Hidden until lock" or just don't render the tooltip). After lock: show everything. Audit the entire app for places that expose other users' picks and gate them all behind this shared lock check.
