# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Limit scoring multiplier values to max 1000**: In group scoring settings, users should not be able to enter values above 1000 for any points-per-round or upset-bonus-per-round field. Add max=1000 validation on both the client input fields and the server API.

- **Limit group name length**: Set a reasonable max length for group names — 50 characters. Add validation on both client and server.

- **Add live scores banner to simulation page**: Reuse the same live scores ticker from the /bracket page on the /simulate page. Place it at the bottom of the page instead of the top. Make it collapsible so users can hide it for more simulation space. Default to collapsed. Remember collapse state during session.
