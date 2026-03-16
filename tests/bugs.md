# Bugs — Fix these BEFORE working on any PLAN.md tasks


- **CRITICAL - Region placement order is WRONG**: Correct 2026 layout: Top-left=EAST (Duke #1), Top-right=WEST (Arizona #2), Bottom-left=SOUTH (Florida #4), Bottom-right=MIDWEST (Michigan #3). Regions array must be [East, West, South, Midwest]. Update bracket_data on server to reorder regions.

- **Missing team logos for 2026 tournament**: Add ESPN team IDs to bracket_data for all 68 teams.

- **Print view bracket doesn't fit on one page**: Add @media print CSS for landscape, scale-to-fit, hide UI chrome.
