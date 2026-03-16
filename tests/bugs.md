# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **First Four slots show full team names instead of abbreviations**: Unresolved First Four R64 slots show "Lehigh" and "Prairie View" as full names which makes the matchup box too wide. Show abbreviations with logos: "LEH/PV" with both team logos side by side, "NCSU/TEX", "HOW/UMBC", "SMU/M-OH". The abbreviations are short enough to fit logos. Once the First Four game resolves, show the winner's full name + logo like normal. Also set a fixed max-width on all matchup boxes so no team name can stretch the bracket layout — use text-overflow: ellipsis for any name that's too long.

- **Add footer with padding**: Add a simple footer to the layout with some bottom padding so content doesn't feel trapped at the very bottom of the page. Include "Made by Declan Edgecombe" in small muted text. Apply to all pages via the root layout.
