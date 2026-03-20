# March Madness Picker — Development Plan

Tasks ordered by priority. Agent picks the top incomplete one.

## Tasks
- [x] Replace "Max Possible" with true max including upset bonuses: The current max possible only counts base points. Replace it with a brute-force calculation that finds the tournament outcome maximizing each bracket's score including upset bonuses. Algorithm: for each region independently, enumerate all 2^15=32768 possible outcomes and find the best score for that bracket's picks (tracking which E8 winner produces it). Then try all FF/Championship combinations using the per-region results. Total: ~131K evaluations per bracket, runs in ~200ms. Implementation: compute client-side after the leaderboard loads. Show a small loading spinner (⏳) in each "Max" cell while computing, then replace with the number when done. Do NOT block the page render — use requestIdleCallback or setTimeout(0) to compute in the background. The leaderboard should load and display immediately with spinners, then fill in max scores progressively. See /tmp/max_calc.js pattern for the algorithm (or ask to see it). Needs: bracket_data (regions/seeds), picks, scoring settings.
- [x] Simulation: truncate player-bracket column so avg points, avg place, and win % are fully visible without scrolling.
- [x] Simulation: highlight the current user's own bracket(s) in the simulated standings box, same style as in the Monte Carlo results table.
- [x] Simulation: switching groups should preserve any hypothetical results the user already set on the bracket.
- [x] Simulation: show live scores for in-progress games and add an "If Current Results Hold" button that auto-fills hypothetical results based on which team is currently winning.
- [x] Simulation: use the same mobile bracket layout (round tabs) as the main bracket page when on small screens.
- [x] Leaderboard: add emoji indicators — ~~🔥N for hot streaks (done)~~, ~~🤡 if entire Final Four eliminated without any correct (done)~~, 😱 if only person to get a specific pick correct.
- [x] Leaderboard: ~~shorten username and bracket name display. Make username column sticky on horizontal scroll.~~ Make total score column sticky after username.
- [x] Leaderboard: Add a "Bonus" column showing upset bonus points earned.
- [x] Leaderboard: Make round-by-round scores clickable to show that round's picks (same as total score click).
- [x] Leaderboard: tiebreaker column should be visible without scrolling — reduce column widths to fit.
- [x] Add Monte Carlo simulation to /simulate page: See @specs/simulator.md for full spec. On page load, run 1000 simulations using historical seed win rates to determine each bracket's avg score, avg place, and win %. Show results in a sortable table. Recalculate when user sets hypothetical results. All client-side, non-blocking with progress indicator. Reuse existing scorePicks() and seed stats data.
- [x] Rework /simulate page: use full Bracket component instead of game list. Clicks set hypothetical results. Live leaderboard sidebar re-sorts as user clicks. Group selector at top.
- [x] Replace /compare with overlay comparison: ONE bracket showing multiple users' picks with colored indicators per user. Dropdown to select users (up to 4). Remove old side-by-side page.
- [x] Auto-fill incomplete brackets at lock time using Smart autofill for empty slots.
- [x] Give each bracket its own URL: /bracket/[username]/[bracketName]. List page at /bracket/[username].
- [x] "Who picked whom": per-game breakdown of group members' picks.
- [x] "Bracket Busted" indicator: skull icon on leaderboard when user's champion is eliminated.
- [x] Shareable public bracket link that works without login.
- [x] Scoring breakdown popup: click a leaderboard score to see per-pick detail with bonus points.
- [x] "Eliminated from contention" indicator on leaderboard.
- [x] Bracket stats dashboard: most popular champion, biggest upset picked, most chalk/contrarian bracket.
- [x] Mini-bracket widget: compact Final Four + Championship view for cards/sidebars.
- [x] Auto-pick reminder banner when lock time is approaching and bracket isn't complete.
- [x] Print-friendly bracket view.
- [x] Group creator can remove brackets from their group.
- [x] Group admin can lock/unlock bracket submissions independently of tournament lock time.
- [x] Simple Mode (1/12): Extract `cascadeClear` from Bracket.tsx into a shared utility in `src/lib/bracketUtils.ts` so both Bracket and SimpleMode can reuse it.
- [x] Simple Mode (2/12): Build `buildGameOrder(regions)` function that returns the ordered list of 63 game IDs (R64→R32→S16→E8→FF→Championship, grouped by region within each round). Add to `src/lib/bracketUtils.ts`.
- [x] Simple Mode (3/12): Create `src/components/bracket/SimpleMode.tsx` component shell — full-screen modal overlay with step navigation state, exit button, and basic layout structure.
- [x] Simple Mode (4/12): Build matchup card UI for single game display — two team cards (logo, name, seed, region color accent), tap to pick. Auto-advance after 300ms highlight.
- [x] Simple Mode (5/12): Wire pick handling into SimpleMode — selecting a team updates picks state, changing a previous pick triggers cascadeClear on downstream games, currentStep adjusts to first unpicked game.
- [ ] Simple Mode (6/12): Add progress bar and labels — "Game N of 63" counter, region name, round name in the top bar.
- [ ] Simple Mode (7/12): Add back/skip navigation — "← Back" returns to previous picked game, "Skip →" advances to next resolvable game, show message when no more games can be shown due to skipped dependencies.
- [ ] Simple Mode (8/12): Add tiebreaker prompt — after all 63 games are picked, show tiebreaker score input ("Predict the total combined score of the championship game").
- [ ] Simple Mode (9/12): Add review screen — after tiebreaker, show completed bracket summary with "Save Bracket" button that calls the existing savePicks API and exits Simple Mode.
- [ ] Simple Mode (10/12): Add mini bracket preview — collapsible thumbnail in the corner showing region winners + FF, using existing MiniBracket component. Hidden by default with a toggle.
- [ ] Simple Mode (11/12): Add "Fill Step-by-Step" entry point button on the bracket page (next to autofill). Only shown when bracket is unlocked and has empty picks.
- [ ] Simple Mode (12/12): Mobile styling — ensure matchup cards stack vertically on small screens, progress bar and navigation are touch-friendly, mini bracket preview is hidden by default on mobile.

## Completed
- [x] Multiple brackets per user, custom names, enter into multiple groups
- [x] Group max brackets, custom scoring with upset bonuses
- [x] Bracket display: connector lines, region colors, team logos, eliminated dimming, champion highlight
- [x] Autofill (Smart/Chalk/Random), tiebreaker question, confirmation dialog
- [x] Mobile responsive, countdown timer, pick distribution stats, reset picks
- [x] Max possible remaining score, bracket PDF/image export
- [x] First Four support, ESPN auto-resolve
- [x] Round-by-round leaderboard, percentile rank, best possible finish
- [x] Admin bulk import/update, correct/incorrect color coding
- [x] Compare brackets (being replaced), user profile, notifications
- [x] Dark/light theme, group chat, bracket animations, seed stats on hover
- [x] What-If simulator (being reworked to use bracket view)

- [x] Mobile bracket: add Next/Prev navigation buttons at the bottom of each tab. R64/R32 tab gets a "Next →" button. S16/E8 tab gets "← Prev" and "Next →". FF/Championship tab gets "← Prev". Buttons should switch to the next/previous tab. Makes it easy to flow through picks without scrolling back to the top to tap tabs.

- [x] Research and design a "Simple Mode" for filling out brackets: A guided step-by-step mode where the user goes through games one at a time — show one matchup, pick a winner, advance to the next. Games flow in bracket order (R64 game 1, game 2, ... then R32, etc). Show a progress bar "Game 12 of 63". At the end, prompt for the tiebreaker score. This is for casual users who find the full bracket view overwhelming. Write findings and proposed UX to specs/simple-mode.md before implementing. Consider: how to handle going back to change a pick, how cascade clearing works in this mode, whether to show the bracket building up as they go.

- [x] Refactor ESPN sync to use ESPN team IDs instead of name matching: The current name-matching approach keeps breaking on apostrophes and special characters (Hawai'i, Saint Mary's, etc). Each team in bracket_data already has an `espnId` field. Refactor espnSync.ts to match ESPN game results by team ID instead of team name. ESPN's scoreboard API returns team IDs in `competitors[].team.id`. This eliminates all name-matching bugs permanently.
