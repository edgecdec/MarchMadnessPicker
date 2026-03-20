# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **Simulation page should be locked for non-admins until brackets lock**: Show "Available after brackets lock" for non-admin users.

- **Monte Carlo should run 10000 simulations, update every 1000**: See @specs/simulator.md.

- **Simulator doesn't cascade-clear hypothetical results**: Changing an earlier round should remove the eliminated team from all later rounds, same as bracket edit page.

- **Simulator leaderboard should show tied ranks**: Same score = same rank (e.g. "T-1").

- **Simulator leaderboard should show score delta**: Show +/- delta from actual current score to simulated score.

- **Simulator: make leaderboard and Monte Carlo sections collapsible**: Add collapse/expand toggles. Default expanded. Remember state during session.

- **Add help (?) icons to Monte Carlo and Leaderboard sections on simulator**: Add a small ❓ icon next to the "Monte Carlo Results" and "Simulated Standings" headers. On hover (desktop) or tap (mobile), show a tooltip/popover explaining in plain language: Monte Carlo = "We simulate the rest of the tournament 10,000 times using historical odds to estimate each bracket's chance of winning." Leaderboard = "Shows what the standings would look like if the hypothetical results you selected actually happen." Keep the language simple and non-technical.
