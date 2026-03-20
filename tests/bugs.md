# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Monte Carlo should show results after first 1000 sims then update every 1000**: Don't wait for all 10000 simulations to finish before showing numbers. Display the Monte Carlo results table with data after the first 1000 simulations complete, then progressively update the numbers every 1000 simulations (2000, 3000, ... 10000). The progress bar should show "Simulating... 3000/10000" and the table values should visibly update as more simulations complete.
