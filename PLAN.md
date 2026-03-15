# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Tasks are ordered by priority (top = most important).

## Tasks

### High Priority
- [ ] Support multiple brackets per user: update DB schema so picks table allows multiple entries per user per tournament, each with a unique bracket name. Add UI to create/name/switch between brackets.
- [ ] Allow users to enter the same bracket into multiple groups: add a bracket-to-group assignment system so one bracket can be submitted to several groups.
- [ ] Group admin can set max number of brackets allowed per group: add max_brackets field to groups table and enforce it when users submit brackets to a group.
- [ ] Users can give their brackets custom names: add a name field to picks/brackets, show it in the UI, allow renaming.

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

### Completed
- [x] Make bracket UI mobile responsive (horizontal scroll on small screens, larger touch targets)
- [x] Add countdown timer showing time until picks lock
- [x] Show pick distribution stats (e.g. "75% of players picked Duke to win this game")
- [x] Add ability for users to reset/clear all their picks
- [x] Show "max possible remaining score" on leaderboard (how high could each player still get)
