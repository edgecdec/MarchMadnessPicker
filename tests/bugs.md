# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **First Four games should not be pickable — auto-resolve only**: Remove any First Four picking UI. R64 slot shows "NCSU/TEX" until auto-resolved.

- **Fix bracket matchup box widths — must be fixed size**: Set fixed width. Use abbreviations for unresolved First Four slots. Truncate long names with ellipsis.

- **CRITICAL - Region placement order is WRONG**: Correct 2026 layout: Top-left=EAST (Duke #1), Top-right=WEST (Arizona #2), Bottom-left=SOUTH (Florida #4), Bottom-right=MIDWEST (Michigan #3). Regions array must be [East, West, South, Midwest]. Update bracket_data on server to reorder regions.

- **Missing team logos for 2026 tournament**: Add ESPN team IDs to bracket_data for all 68 teams.

- **Print view bracket doesn't fit on one page**: Add @media print CSS for landscape, scale-to-fit, hide UI chrome.
