# March Madness Picker — Development Plan

Tasks ordered by priority. Agent picks the top incomplete one.

## Tasks
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
