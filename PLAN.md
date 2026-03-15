# March Madness Picker — Development Plan

## How This Works
An agent reads this file each loop iteration, picks the most important incomplete task, implements it, builds, commits, and pushes. Tasks are ordered by priority (top = most important).

## Tasks

### High Priority
- [x] Add First Four (play-in) support: The bracket has 68 teams, not 64. Four R64 slots have play-in games (2 between 16-seeds, 2 between 11-seeds). Add a `first_four` field to bracket_data with the 4 matchups. In the bracket UI, show "TeamA/TeamB" in unresolved First Four R64 slots. Add a small "First Four" section above the bracket showing the 4 play-in games. Users can pick either team from a First Four pair to advance through the bracket. When First Four resolves, the bracket slot updates to show just the winner.
- [x] Auto-resolve game results from ESPN API: Create an admin API endpoint or cron-style mechanism that fetches NCAA tournament results from ESPN (site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?groups=100) and automatically updates the tournament results_data when games finish. Match ESPN team names to our bracket team names. This should handle First Four games too — auto-resolve the First Four slots when those games complete. Add a "Sync Results from ESPN" button on the admin page that triggers this manually.

### Bracket Display Improvements

### Picking Experience

### Leaderboard & Scoring
- [x] Add round-by-round score breakdown on leaderboard (columns for R64, R32, S16, E8, FF, Champ points)
- [x] Show percentile rank on leaderboard ("Your bracket is in the 85th percentile")
- [x] Add "best possible finish" to leaderboard — highest rank each player could still achieve given remaining games

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
