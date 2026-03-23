# Bugs — Fix these BEFORE working on any PLAN.md tasks











- **Add basketball emoji to browser tab title**: Update the page title/favicon to include a 🏀 emoji so the browser tab shows "🏀 March Madness Picker". Set this in the root layout metadata.

- **Show correct team when a pick is wrong in future rounds**: When a user's picked team has been eliminated but appears in a later round slot, cross out the wrong pick (strikethrough + muted) and show the actual team that advanced. If the wrong pick is the top team in the matchup, show the correct team above it. If the wrong pick is the bottom team, show the correct team below it. This helps users see at a glance where their bracket diverged from reality.
