# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **Bracket layout: top pane slightly too tall causing scrollbar, Final Four positioning**: Two issues: (1) The top region pane (East/West) is slightly taller than the bottom pane, causing a random horizontal or vertical scrollbar. Make both panes exactly the same height — check for any extra padding, margin, or border on the top pane that the bottom doesn't have. Use overflow:hidden on the bracket container if needed. (2) The Final Four section should overlap both the top and bottom panes — use CSS position:absolute or negative margins to shift the Final Four downward so it visually bridges the gap between the two region panes, overlapping the bottom of the top pane and the top of the bottom pane. This creates the classic bracket look where the Final Four sits in the center seam. Make sure the Final Four has a higher z-index so it renders on top of both panes.
