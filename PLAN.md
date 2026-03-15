# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Tasks are ordered by priority (top = most important).

## Tasks

### High Priority
- [ ] Rework "What-If" simulator to use bracket view: The current /simulate page shows games as a list. Replace it with the full bracket view (reuse the Bracket component). Current results should be filled in. For remaining unplayed games, the user clicks a team to hypothetically set the winner — same interaction as filling out a bracket, but it's setting simulated results not picks. Show a live-updating leaderboard sidebar/panel that re-sorts as the user clicks hypothetical winners. Highlight rank changes with arrows up/down. Keep the group selector at the top.
- [x] Replace the "Compare Brackets" side-by-side view with a single-bracket overlay comparison. Show ONE bracket where each matchup displays both users' picks with colored indicators per user. Add a dropdown to select which users/brackets to compare (up to 3-4). Remove the old side-by-side /compare page and its smoke test.
- [ ] Auto-fill incomplete brackets at lock time using "Smart" autofill: When the tournament lock time hits, any bracket that isn't fully filled out (less than 63 picks) should automatically get its remaining empty slots filled using the Smart autofill (historical seed win rates). This ensures every bracket is complete for scoring. Run this as part of the lock process or as a check when lock time passes.
- [ ] Give each bracket its own URL: Restructure bracket URLs so each bracket is accessible at /bracket/[username]/[bracketName] or /bracket/[bracketId]. The current /bracket page should list the user's brackets and link to each one. /bracket/[username] should show a list of that user's brackets (after lock time). This makes brackets individually shareable.

### Features
- [ ] "Who picked whom" page: For each game in the bracket, show a breakdown of which users in your group picked which team. Helps see consensus and contrarian picks.
- [ ] "Bracket Busted" indicator: Show a skull/X icon next to users on the leaderboard whose championship pick has been eliminated.
- [ ] Shareable bracket link: Generate a public read-only link to a specific bracket that works without login. For sharing on social media.
- [ ] Bracket scoring breakdown popup: Click on any user's score on the leaderboard to see a detailed breakdown — which picks were correct, how many points each earned, bonus points from upsets.
- [ ] "Eliminated from contention" indicator on leaderboard: Show when a user can no longer mathematically win the group even with perfect remaining picks.
- [ ] Bracket stats dashboard: Show stats like "most popular champion pick in your group", "biggest upset picked", "most chalk bracket", "most contrarian bracket".
- [ ] Mini-bracket widget: A compact bracket view showing just the Final Four + Championship picks. Good for group pages, leaderboards, and sharing.
- [ ] Auto-pick reminder: If a user hasn't submitted picks and lock time is approaching (e.g. 1 hour before), show a prominent banner warning them.
- [ ] Print-friendly bracket view: A clean, printer-optimized layout for people who want to print and fill out by hand or post on a wall.
- [ ] Group admin can lock/unlock bracket submissions independently of tournament lock time.
- [ ] Group creator can remove brackets from their group: Add a delete/remove button next to each bracket on the group leaderboard, visible only to the group creator. This removes the bracket-to-group assignment, not the bracket itself. Confirmation dialog before removing.

### Completed
- [x] Support multiple brackets per user
- [x] Allow users to enter the same bracket into multiple groups
- [x] Group admin can set max number of brackets allowed per group
- [x] Users can give their brackets custom names
- [x] Add connector lines between matchups
- [x] Color-code each region with a distinct accent color
- [x] Grey out / dim eliminated teams across all rounds
- [x] Add team logos next to team names in matchups
- [x] Highlight the championship pick prominently in the center
- [x] Add autofill options: Smart, Chalk, Random
- [x] Add tiebreaker question: predict championship game total score
- [x] Add confirmation dialog before submitting picks
- [x] Make bracket UI mobile responsive
- [x] Add countdown timer showing time until picks lock
- [x] Show pick distribution stats
- [x] Add ability for users to reset/clear all their picks
- [x] Show "max possible remaining score" on leaderboard
- [x] Add bracket PDF/image export
- [x] Add First Four (play-in) support
- [x] Auto-resolve game results from ESPN API
- [x] Add round-by-round score breakdown on leaderboard
- [x] Show percentile rank on leaderboard
- [x] Add "best possible finish" to leaderboard
- [x] Let admin bulk-import bracket data via JSON paste
- [x] Let admin bulk-update results via JSON paste
- [x] Show correct/incorrect color coding on view-others-bracket page
- [x] Add compare brackets view (being replaced with overlay version)
- [x] Add user profile page with groups, stats, pick history
- [x] Add notification/banner when new results are entered
- [x] Dark/light theme toggle
- [x] Add chat/comments per group
- [x] Animate bracket transitions when clicking picks
- [x] Show historical seed matchup stats on hover
