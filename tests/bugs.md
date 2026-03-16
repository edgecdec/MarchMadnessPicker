# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Improve print functionality**: The current print view almost fits the bracket on one page but the scaling isn't right. Research how ESPN Tournament Challenge and CBS Bracket Manager handle printing — look at their @media print CSS, page sizing, and scaling approach. Then improve ours: the full bracket (all 4 regions + Final Four + Championship) should fit cleanly on a single landscape page with no awkward scaling artifacts. Consider: using @page { size: landscape; margin: 0.25in }, calculating the exact scale factor to fit the bracket width to the printable area, hiding all non-bracket UI (navbar, buttons, scores, etc), and making text/logos crisp at the printed size. The printed bracket should look like something you'd pin on a wall at a watch party.

- **Final Four section causes scroll/layout issues**: The Final Four and Championship section is too prominent and is breaking the bracket layout, causing unwanted scrolling. Tone it down — make the FF/Championship matchup boxes the same size as regional matchups (not bigger). Position the Final Four as a separate element centered between the top and bottom region panes, vertically aligned so it bridges the gap naturally. Don't let it push content or create overflow. Keep it visually distinct with just a subtle label and maybe a slightly different border color, but NOT bigger boxes or extra padding that breaks the layout.
