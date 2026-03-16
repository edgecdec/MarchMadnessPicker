# Anti-Patterns — Things Ralph Must NOT Do

These are mistakes Ralph has made before. Read this every loop.

## Deployment
- NEVER restart pm2 without verifying .next/static/chunks/ has JS files
- NEVER push code that doesn't pass `npx next build` locally
- A curl returning 200 does NOT mean the site works — chunks can be missing
- NEVER modify deploy_webhook.sh or server.js webhook handler
- NEVER run `node server.js` locally as a background process — it gets stuck

## Code Quality
- NEVER use dynamic `require()` inside route handlers — use top-level ES imports
- NEVER use `ON CONFLICT` SQL without verifying the constraint still exists in the schema
- NEVER mark a bug as fixed without testing the exact scenario that caused it
- NEVER strikethrough bugs in bugs.md — DELETE the line entirely when fixed

## Context Management
- Do NOT read every file in the project — only read files relevant to the current task
- Do NOT explore the directory tree unless you need to find something specific
- Read the relevant spec file ONCE, then work from memory
- Keep commits small and focused — one logical change per commit

## Testing
- Nova Act auth errors are NOT bugs — never log them to bugs.md
- A 401 "Not authenticated" from an API is expected behavior, not a bug
- Always test the specific thing you changed, not just the homepage

## Schema Changes
- After changing DB schema, verify existing data still works
- SQLite ALTER TABLE is limited — use migration pattern in db.ts initDb()
- Always check if the migration already ran (try/catch the ALTER)

## bugs.md and PLAN.md Handling
- ALWAYS read bugs.md and PLAN.md before editing them — another agent or human may have made changes
- When fixing a bug, DELETE only that specific bug line — do not rewrite the entire file
- When adding a bug you discovered, APPEND it — do not touch existing entries
- Never re-add a bug that was already deleted/fixed
- If you're unsure whether a bug is still valid, check the code first before removing it
