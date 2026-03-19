# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Make live game stats links clickable to ESPN**: The live scores section shows game info but the links aren't clickable. Make each game link to the ESPN game page (e.g. `https://www.espn.com/mens-college-basketball/game/_/gameId/{espnGameId}`). Open in a new tab.

- **Show live scores of active games inside the bracket matchups**: When a game is currently being played, show the live score (e.g. "Duke 45 - Siena 32, 2nd 8:42") directly in the bracket matchup box for that game. Use the existing ESPN scores API data. Only show for in-progress games — completed games show "Final" or just the winner.

- **False "empty slots" warning for completed brackets**: The dashboard shows "Declan has 3 empty slots — picks lock in 12h!" even though all 63 picks are filled. The empty slot count is wrong — it's likely counting First Four play-in game slots (which users don't pick) as empty. Fix: the pick completeness check should only count the 63 pickable game IDs (R64 through Championship), not First Four slots. Verify by checking a bracket with all 63 picks filled shows no warning.
