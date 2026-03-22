# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **CRITICAL - Leaderboard page is broken/blank**: The leaderboard page at /leaderboard loads HTML but renders blank (only footer visible). This is a client-side React crash — likely another hooks error or a runtime exception in the leaderboard component. Check recent commits that touched the leaderboard page or shared components it uses. Build locally and check the browser console for the exact error. This may be related to the medium bracket breakpoint change or the maintenance page commit if they touched shared layout components.

- **Limit scoring multiplier values to max 1000**: In group scoring settings, users should not be able to enter values above 1000 for any points-per-round or upset-bonus-per-round field. Add max=1000 validation on both the client input fields and the server API.

- **Limit group name length**: Set a reasonable max length for group names — 50 characters. Add validation on both client and server.

- **Add live scores banner to simulation page**: Reuse the same live scores ticker from the /bracket page on the /simulate page. Place it at the bottom of the page instead of the top. Make it collapsible so users can hide it for more simulation space. Default to collapsed. Remember collapse state during session.
