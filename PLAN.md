# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Tasks are ordered by priority (top = most important).

## Tasks

### High Priority
- [x] Support multiple brackets per user: update DB schema so picks table allows multiple entries per user per tournament, each with a unique bracket name. Add UI to create/name/switch between brackets.
- [x] Allow users to enter the same bracket into multiple groups: add a bracket-to-group assignment system so one bracket can be submitted to several groups.
- [x] Group admin can set max number of brackets allowed per group: add max_brackets field to groups table and enforce it when users submit brackets to a group.
- [x] Users can give their brackets custom names: add a name field to picks/brackets, show it in the UI, allow renaming.

### Bracket Display Improvements
- [x] Add connector lines between matchups to visually show which games feed into which (SVG or CSS borders connecting rounds)
- [x] Color-code each region with a distinct accent color (e.g. East=blue, West=red, South=green, Midwest=orange) in the region header and matchup borders
- [x] Grey out / dim eliminated teams across all rounds after results are entered (team lost = faded everywhere they appear in later rounds)
- [x] Add team logos next to team names in matchups. Store logo URLs in bracket_data for each team. ESPN logos available at espncdn.com/i/teamlogos/ncaa/500/{teamId}.png
- [x] Highlight the championship pick prominently in the center of the bracket with larger text and the team logo

### Picking Experience
- [x] Add autofill options shown as buttons above the bracket: "Smart" (uses historical seed matchup win percentages to probabilistically pick — e.g. if 12-seeds historically beat 5-seeds 36% of the time, the 12-seed gets picked 36% of the time), "Chalk" (all higher seeds win), "Random" (fully random picks). Store historical seed vs seed win rates in src/lib/seedStats.ts.
- [x] Add tiebreaker question: "Predict the total combined score of the Championship Game" — stored per bracket, used to break ties on leaderboard
- [ ] Add confirmation dialog before submitting/saving picks with a summary of key picks (Final Four, Champion)

### Leaderboard & Scoring
- [ ] Add round-by-round score breakdown on leaderboard (columns for R64, R32, S16, E8, FF, Champ points)
- [ ] Show percentile rank on leaderboard ("Your bracket is in the 85th percentile")
- [ ] Add "best possible finish" to leaderboard — highest rank each player could still achieve given remaining games

### Admin
- [ ] Let admin bulk-import bracket data via JSON paste on admin page
- [ ] Let admin bulk-update results via JSON paste on admin page

### Social & Views
- [ ] Show which picks are correct/incorrect with color coding on the view-others-bracket page
- [ ] Add a "compare brackets" view showing two users' picks side by side
- [ ] Add user profile page showing their groups, stats, pick history

### Lower Priority
- [ ] Add notification/banner when new results are entered
- [ ] Dark/light theme toggle
- [ ] Add chat/comments per group
- [ ] Animate bracket transitions when clicking picks
- [ ] Show historical seed matchup stats on hover (e.g. "12-seeds beat 5-seeds 36% of the time")

### Completed
- [x] Make bracket UI mobile responsive (horizontal scroll on small screens, larger touch targets)
- [x] Add countdown timer showing time until picks lock
- [x] Show pick distribution stats (e.g. "75% of players picked Duke to win this game")
- [x] Add ability for users to reset/clear all their picks
- [x] Show "max possible remaining score" on leaderboard (how high could each player still get)
- [x] Add bracket PDF/image export so users can share their picks
