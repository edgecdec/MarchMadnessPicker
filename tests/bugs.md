# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Redirect to bracket assignment after joining a group**: After a user joins a group via the /join/[code] page, they must end up with a bracket in that group. Flow: (1) User joins group → (2) If user has no brackets, auto-create an empty one named "My Bracket", assign it to the group, and redirect to the bracket edit page. (3) If user has exactly one bracket, auto-assign it to the group and redirect to the bracket edit page. (4) If user has multiple brackets, show a picker to select which one to enter, assign it, then redirect. The user should not be able to skip this — joining a group always results in a bracket in that group.

- **Standardize matchup box widths across the entire bracket**: All matchup boxes in every round must have the same fixed width. Currently some boxes stretch with long team names. Set a consistent max-width, use text-overflow: ellipsis for names that don't fit. This applies to R64 through Elite 8 in all regions, plus Final Four and Championship.

- **Make Final Four and Championship games visually stand out**: The Final Four matchups should be larger/more prominent than regional games — slightly bigger boxes, bolder borders, or a subtle background highlight. The Championship game should stand out even more — larger text, gold/accent border, more padding. Keep the vertical spacing correct so games still align properly with their feeder matchups. Don't break the bracket layout — just make the center games feel more important visually.
