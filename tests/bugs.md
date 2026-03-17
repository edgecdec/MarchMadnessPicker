# Bugs — Fix these BEFORE working on any PLAN.md tasks








- **Mobile bracket view: show 2 rounds at a time in tabs**: On small screens (<768px), replace the full bracket layout with a tabbed view showing 2 rounds per tab: Tab 1 = "R64 & R32", Tab 2 = "Sweet 16 & Elite 8", Tab 3 = "Final Four & Championship". Each tab shows the relevant matchups stacked vertically, organized by region. Use the existing matchup components. Desktop layout stays unchanged. Detect screen width with a media query or hook.
