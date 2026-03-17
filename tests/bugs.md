# Bugs — Fix these BEFORE working on any PLAN.md tasks








- **Final Four component doesn't respect light mode in export**: The Final Four section in the bracket PNG export still renders with dark mode colors even when the user is in light mode. MUI should handle this but the Final Four component likely has hardcoded dark colors (e.g. explicit color values instead of theme-aware ones). Fix: replace any hardcoded color values in the FinalFour component with MUI theme tokens.

- **Audit all components for dark/light mode support**: Go through every component and check for hardcoded colors that don't respond to the theme toggle. Common culprits: inline sx styles with explicit hex colors, background colors, border colors, text colors. Replace with theme-aware values (e.g. `text.primary`, `background.paper`, `divider`). Ensure the bracket, leaderboard, groups, dashboard, and all dialogs look correct in both modes.

- **Saving bracket name temporarily clears picks display**: When renaming a bracket, the picks visually disappear briefly before reappearing. The rename API response or state update is likely resetting the picks state. Fix: the rename operation should only update the bracket name in state, not touch the picks object. Check if the API response overwrites the local picks state.

- **Mobile bracket view: show 2 rounds at a time in tabs**: On small screens (<768px), replace the full bracket layout with a tabbed view showing 2 rounds per tab: Tab 1 = "R64 & R32", Tab 2 = "Sweet 16 & Elite 8", Tab 3 = "Final Four & Championship". Each tab shows the relevant matchups stacked vertically, organized by region. Use the existing matchup components. Desktop layout stays unchanged. Detect screen width with a media query or hook.
