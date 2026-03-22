# Bugs — Fix these BEFORE working on any PLAN.md tasks





- **Emoji format: number before emoji for all indicators**: All emoji indicators should show the count BEFORE the emoji, not after. E.g. "5🔥" not "🔥5", "3😱" not "😱3". Apply this consistently to fire (streak), shocked (rare picks), and any future emoji indicators. Add this as a pattern rule in the codebase.

- **Leaderboard player/emoji column layout wastes space**: Shrink the total player+bracket+emoji column width by 20% from current. Within that column, right-align the emojis and let them grow leftward toward the text. The player/bracket text should fill the remaining space with text-overflow: ellipsis. This way emojis only take the space they need (no fixed width), and the text gets as much room as possible. No wasted gap between text and emojis — they share one flex row with text on the left (ellipsis) and emojis on the right (shrink-to-fit).
