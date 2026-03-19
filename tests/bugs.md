# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **False "empty slots" warning for completed brackets**: The dashboard shows "Declan has 3 empty slots — picks lock in 12h!" even though all 63 picks are filled. The empty slot count is wrong — it's likely counting First Four play-in game slots (which users don't pick) as empty. Fix: the pick completeness check should only count the 63 pickable game IDs (R64 through Championship), not First Four slots. Verify by checking a bracket with all 63 picks filled shows no warning.
