# Bugs — Fix these BEFORE working on any PLAN.md tasks






- **Picking championship winner clears the opponent from the championship game**: When you click a team to win the championship (ff-5-0), the other team in the championship matchup disappears. This only happens in the championship game, not in the Final Four semis or earlier rounds. The cascade clearing logic is likely treating the championship pick as a "change" and clearing the losing team from the matchup, but it shouldn't — both teams should remain visible, with the winner highlighted. Check the cascadeClear function and the FinalFour component — the championship game's opponent should never be removed when a winner is picked.
