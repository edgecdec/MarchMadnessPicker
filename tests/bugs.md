# Bugs — Fix these BEFORE working on any PLAN.md tasks







- **Leaderboard: let username/bracket text fill all available space up to the emojis**: The text should not have a fixed max-width — it should use `flex: 1` (or equivalent) to fill all remaining space in the row after the emojis. If there are no emojis, the text gets the full column width. If there are 3 emojis, the text gets the column width minus the emoji width. Text truncates with ellipsis only when it actually runs into the emojis, not before.
