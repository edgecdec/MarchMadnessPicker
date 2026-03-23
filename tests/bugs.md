# Bugs — Fix these BEFORE working on any PLAN.md tasks











- **Shocked emoji: change threshold to 10%, show % and round advanced to in tooltip**: Change the 😱 threshold from 5% to 10%. In the tooltip, show the team name, the round they ADVANCED to (not the round they won in), and the pick percentage. E.g. "Texas - Sweet 16 (4%)" means the user predicted Texas to make the Sweet 16 and only 4% of brackets had that pick.

- **Simulator: make leaderboard and Monte Carlo panels same height and resizable**: On the simulator page, set both the leaderboard panel and Monte Carlo panel to the same height (use the current Monte Carlo height). Add drag-to-resize handles so users can make either panel bigger or smaller. Use CSS resize or a drag handle component.

- **Add basketball emoji to browser tab title**: Update the page title/favicon to include a 🏀 emoji so the browser tab shows "🏀 March Madness Picker". Set this in the root layout metadata.

- **Show correct team when a pick is wrong in future rounds**: When a user's picked team has been eliminated but appears in a later round slot, cross out the wrong pick (strikethrough + muted) and show the actual team that advanced. If the wrong pick is the top team in the matchup, show the correct team above it. If the wrong pick is the bottom team, show the correct team below it. This helps users see at a glance where their bracket diverged from reality.
