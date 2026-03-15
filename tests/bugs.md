# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Print view bracket doesn't fit on one page**: The print-friendly bracket view overflows the page — parts of the bracket are cut off. Fix: add a @media print CSS that forces landscape orientation (`@page { size: landscape }`), scales the entire bracket to fit within one page (`transform: scale()` or `zoom`), reduces font sizes and padding for print, and hides non-essential elements (navbar, live scores, buttons). The entire 4-region bracket + Final Four must be visible on a single landscape page without overflow.
