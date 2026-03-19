# Bugs — Fix these BEFORE working on any PLAN.md tasks



- **Add `is_hidden` column to users table**: Add an `is_hidden INTEGER NOT NULL DEFAULT 0` column to the users table. Hidden users should be excluded from the global leaderboard, group leaderboards, pick distribution stats, and any public-facing user lists. They should still be able to log in and view their own brackets. Add a migration in db.ts initDb() with try/catch ALTER TABLE. Update all leaderboard queries and distribution queries to filter out hidden users (`WHERE u.is_hidden = 0`).

- **Create "Random High EV" user and upload 500 brackets**: Create a user with username "Random High EV", password "test", is_hidden=1. Do NOT add to the Everyone group. Create a new group called "Random High EV Brackets" with this user as creator. Load brackets from `/Users/edeclan/TestProjects/MarchMadnessSemiOptimal/random_high_ev_brackets.json` — this is a JSON array of 500 objects with `{rank, ev, picks_data}`. For each bracket, create a pick entry with bracket_name "Random High EV #001" through "#500" (zero-padded), picks_data from the JSON, tournament_id for the 2026 tournament. Assign all brackets to the "Random High EV Brackets" group. Run on server via SSH.

- **Create "Highest EV" user and upload 500 brackets**: Create a user with username "Highest EV", password "test", is_hidden=1. Do NOT add to the Everyone group. Create a new group called "Highest EV Brackets" with this user as creator. Load brackets from `/Users/edeclan/TestProjects/MarchMadnessSemiOptimal/top500_brackets.json` — same format as above. Name brackets "Highest EV Bracket #001" through "#500". Assign all to the "Highest EV Brackets" group. Run on server via SSH.
