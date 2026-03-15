# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 23:10] ~~**Site shows black page after deploy**: The `.next/` directory on the server is empty — the deploy wiped it but the build either failed or hasn't completed.~~ **FIXED** — Rebuilt on server manually (`pm2 stop && rm -rf .next && npm run build && pm2 restart`). Deploy script already has lock file and build check. Race condition was a one-off.

- [2026-03-14 22:55] ~~**Save bracket fails**: JSON.parse error when clicking Save Picks.~~ **FIXED** — uuid import issue in picks route.

- [2026-03-14 23:18] **Creating AND saving brackets fails with 500**: POST /api/picks returns "ON CONFLICT clause does not match any PRIMARY KEY or UNIQUE constraint". This breaks BOTH creating new brackets and saving picks to existing ones. The picks table schema was changed to support multiple brackets per user (removed the UNIQUE(user_id, tournament_id) constraint), but the INSERT statement in src/app/api/picks/route.ts still uses `ON CONFLICT(user_id, tournament_id) DO UPDATE`. Fix: update the SQL to match the new schema. For creating a new bracket, just INSERT. For saving/updating an existing bracket, UPDATE WHERE id = bracket_id. The ON CONFLICT upsert pattern no longer works since the unique constraint is gone.
