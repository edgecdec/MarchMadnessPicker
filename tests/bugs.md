# Bugs — Fix these BEFORE working on any PLAN.md tasks




- **Leaderboard: expand bracket name area, shrink emoji area**: The emoji section is taking up too much horizontal space relative to the player/bracket name. Reduce the space allocated to emojis and give more to the bracket name so names are more readable.

- **Hot streak count is wrong — edgecdec shows 5 but got Nebraska wrong**: The hot streak (🔥) calculation is incorrect. Investigate: it should count consecutive CORRECT picks in the most recent resolved games. If edgecdec got Nebraska wrong, the streak should have reset. Check the streak calculation logic — it may be counting games in the wrong order, skipping wrong picks, or not properly checking results.

- **Emoji format: number before emoji for all indicators**: All emoji indicators should show the count BEFORE the emoji, not after. E.g. "5🔥" not "🔥5", "3😱" not "😱3". Apply this consistently to fire (streak), shocked (rare picks), and any future emoji indicators. Add this as a pattern rule in the codebase.
