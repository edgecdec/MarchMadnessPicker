# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Mark tasks [x] when done.

## Tasks

### High Priority
- [x] Make bracket UI mobile responsive (horizontal scroll on small screens, larger touch targets)
- [x] Add countdown timer showing time until picks lock
- [x] Show pick distribution stats (e.g. "75% of players picked Duke to win this game")
- [ ] Add ability for users to reset/clear all their picks
- [ ] Show "max possible remaining score" on leaderboard (how high could each player still get)

### Medium Priority
- [ ] Add bracket PDF/image export so users can share their picks
- [ ] Add round-by-round score breakdown on leaderboard (not just total)
- [ ] Let admin bulk-import bracket data via JSON paste on admin page
- [ ] Let admin bulk-update results via JSON paste on admin page
- [ ] Add confirmation dialog before submitting picks
- [ ] Show which picks are correct/incorrect with color coding on the view-others-bracket page
- [ ] Add a "compare brackets" view showing two users' picks side by side

### Lower Priority
- [ ] Add user profile page showing their groups, stats, pick history
- [ ] Add notification/banner when new results are entered
- [ ] Dark/light theme toggle
- [ ] Add tiebreaker question (predict championship game total score)
- [ ] Add chat/comments per group
- [ ] Animate bracket transitions when clicking picks
