# Bugs — Fix these BEFORE working on any PLAN.md tasks


- **Leaderboard status column shows "checked" for incomplete brackets**: The status column should only show ✅ if the bracket has all 63 picks filled. Brackets with fewer than 63 valid picks (excluding ff-play-* junk keys) should show ⏳ or the number of missing picks. The check is likely counting total keys including First Four junk keys, inflating the count.
