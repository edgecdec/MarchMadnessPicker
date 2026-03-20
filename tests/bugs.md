# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Simulator: find the right username column width**: Ralph has been going back and forth on the player name column width in the Monte Carlo table. Look through recent git commits related to the simulator player name truncation and find a width that balances showing enough of the name while keeping all 3 stat columns (Avg Score, Avg Place, Win %) fully visible without horizontal scrolling. Test with the longest usernames in the DB. Pick a final value and stick with it.
