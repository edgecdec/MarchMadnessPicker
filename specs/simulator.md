# Simulator Monte Carlo Spec

## Overview
When a user lands on the /simulate page, automatically run 10000 Monte Carlo simulations of the remaining tournament games using historical seed win percentages. Display each group member's average score, average placement, and win probability. Recalculate when the user manually sets a hypothetical result.

## Page Layout
- **Top bar**: Group selector dropdown (existing). Below it, a progress indicator (thin progress bar or "Simulating... 450/1000") that shows while simulations run. Do NOT block the page — the user can still interact with the bracket and group selector while simulations run in the background.
- **Left/Main area**: The bracket view (existing) showing actual results + any hypothetical picks the user has made.
- **Right sidebar / Below bracket**: Monte Carlo results table.

## Monte Carlo Results Table
Columns:
- **Player** (username + bracket name)
- **Avg Score** (mean score across all 10000 simulations, 1 decimal)
- **Avg Place** (mean rank across all 10000 simulations, 1 decimal)  
- **Win %** (percentage of simulations where this bracket finished #1, whole number)

Default sort: Win % descending → Avg Place ascending → Avg Score descending.
Clicking any column header sorts by that column. Highlight the current user's row.

## Simulation Logic

### Inputs
- All group members' bracket picks (from API)
- Current actual results (games already played)
- Any hypothetical results the user has manually set on the bracket
- Historical seed matchup win rates (from src/lib/seedStats.ts or similar — same data used by "Smart" autofill)
- Group's scoring settings (points per round, upset bonus)

### For each simulation (10000 total):
1. Start with actual results + user's hypothetical picks as fixed/known outcomes.
2. For each remaining unresolved game (not in actual results AND not set as hypothetical):
   - Determine the two teams that would play (based on results of prior rounds in THIS simulation).
   - Look up the historical win rate for the higher seed vs lower seed.
   - Generate a random number 0-1. If < higher seed win rate, higher seed wins. Otherwise, lower seed wins.
   - Record the winner for this game in this simulation.
3. Once all 63 games are resolved for this simulation, score every group member's bracket against the simulated results using the group's scoring settings (including upset bonuses).
4. Rank all brackets by score (use tiebreaker if scores are tied).
5. Record each bracket's score and rank for this simulation.

### After all 100000 simulations:
- For each bracket: compute average score, average rank, and count of #1 finishes (win %).
- Display in the results table.

### Recalculation triggers:
- User clicks a team in the bracket to set a hypothetical result → re-run all 100000 simulations with the new fixed outcome. Show progress bar again.
- User changes group selector → fetch new group data, re-run.

## Performance
- Run simulations in a Web Worker or use requestIdleCallback to avoid blocking the UI.
- 10000 simulations × ~30 remaining games × ~10 brackets = ~3M operations — should complete in <5 seconds on modern hardware.
- Show results progressively if possible (update table every 1000 simulations).
- Debounce recalculation by 500ms when user clicks hypothetical results rapidly.

## Implementation Notes
- All computation is CLIENT-SIDE. No new API endpoints needed beyond the existing group leaderboard/picks data.
- Reuse the existing `scorePicks()` function from src/lib/scoring.ts.
- Reuse the existing seed matchup win rates from the Smart autofill data.
- The bracket component is already in "simulation mode" — just wire the Monte Carlo on top.
- Store simulation results in React state. No persistence needed.

## What NOT to do
- Do NOT run simulations on the server.
- Do NOT save simulation results to the database.
- Do NOT block the UI during simulation — it must remain interactive.
- Do NOT use external libraries for random number generation — Math.random() is fine.
