# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **Create "Highest EV" user and upload 500 brackets**: Create a user with username "Highest EV", password "test", is_hidden=1. Do NOT add to the Everyone group. Create a new group called "Highest EV Brackets" with this user as creator. Load brackets from `/Users/edeclan/TestProjects/MarchMadnessSemiOptimal/top500_brackets.json` — same format as above. Name brackets "Highest EV Bracket #001" through "#500". Assign all to the "Highest EV Brackets" group. Run on server via SSH.
