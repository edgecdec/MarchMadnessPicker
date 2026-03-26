# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Dark mode colors need better contrast (WCAG AAA)**: The current dark mode foreground colors don't have enough contrast against the dark background. Create a second set of foreground colors specifically for dark mode that pass WCAG AAA minimum contrast ratio (7:1 for normal text, 4.5:1 for large text). Keep light mode colors unchanged. Examples of good dark mode foreground colors: blue #59A3EC, green #49BC4E. Apply this to all text, links, accents, and UI elements that use color in dark mode. Use the MUI theme's dark palette to define these separately from light mode.

- **Increase font weight of containedPrimary button**: Bump the font weight of MUI's `containedPrimary` button variant by one level (e.g. from 500 to 600, or from 600 to 700). Apply via the MUI theme's component overrides.
