# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Center the bracket on the page**: The bracket should be horizontally centered on the page, not left-aligned. Apply proper centering to the bracket container.

- **Improve print functionality**: The current print view almost fits the bracket on one page but the scaling isn't right. Research how ESPN Tournament Challenge and CBS Bracket Manager handle printing — look at their @media print CSS, page sizing, and scaling approach. Then improve ours: the full bracket (all 4 regions + Final Four + Championship) should fit cleanly on a single landscape page with no awkward scaling artifacts. Consider: using @page { size: landscape; margin: 0.25in }, calculating the exact scale factor to fit the bracket width to the printable area, hiding all non-bracket UI (navbar, buttons, scores, etc), and making text/logos crisp at the printed size. The printed bracket should look like something you'd pin on a wall at a watch party.
