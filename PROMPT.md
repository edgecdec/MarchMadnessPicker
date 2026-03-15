You are an autonomous developer agent for the March Madness Picker app.

## Project
- Repo: ~/TestProjects/MarchMadness
- Live: https://marchmadness.edgecdec.com
- Stack: Next.js 15, React 19, MUI 7, SQLite, bcrypt+JWT, custom server.js
- Deploy: push to main → GitHub webhook → auto-deploys to server

## Specs
Read the specs/ folder for detailed requirements on each feature:
- @specs/bracket.md — bracket structure, interaction, display
- @specs/groups.md — groups, invites, scoring settings
- @specs/scoring.md — scoring logic, upset bonuses, tiebreakers
- @specs/deployment.md — server setup, deploy flow, verification

## Structure
```
src/
  types/index.ts       - All shared TypeScript interfaces
  lib/api.ts           - Client-side API calls
  lib/auth.ts          - Server JWT/bcrypt
  lib/db.ts            - SQLite layer
  lib/scoring.ts       - Shared scoring logic
  lib/bracketData.ts   - Bracket constants
  hooks/               - useAuth, useTournament, useLiveScores
  components/common/   - Navbar, ThemeRegistry, ScoringEditor
  components/auth/     - AuthForm
  components/bracket/  - Bracket, RegionBracket, FinalFour, Matchup, LiveScores
  app/                 - Pages + API routes
```

## Your Task Each Loop
1. Read tests/bugs.md — if there are ANY unfixed bugs, fix the FIRST one. Do NOT pick tasks from PLAN.md until bugs.md is clean.
2. If no bugs: read PLAN.md and pick the SINGLE most important incomplete task.
3. Read the relevant spec in specs/ for context on how the feature should work.
4. Make minimal, focused changes following existing patterns:
   - Types go in src/types/index.ts
   - API calls go through src/lib/api.ts
   - Pages use useAuth() hook, show AuthForm for unauthenticated users
   - Components organized by feature folder
5. Run `npx next build` to verify it compiles. If build fails, fix and retry. Do NOT proceed with broken code.
6. Commit and push: `git add -A && git commit -m "descriptive message" && git push`
7. Wait 60 seconds: `sleep 60`
8. Verify deploy succeeded — run ALL of these checks:
   - `curl -s -o /dev/null -w "%{http_code}" https://marchmadness.edgecdec.com` → must be 200
   - `ssh -i ~/.ssh/vps1.priv root@5.78.132.57 "ls /var/www/MarchMadness/.next/static/chunks/*.js 2>/dev/null | wc -l"` → must be > 10
   - If chunks are missing or count is 0, the build failed on the server. SSH in and rebuild: `ssh -i ~/.ssh/vps1.priv root@5.78.132.57 "cd /var/www/MarchMadness && pm2 stop marchmadness && rm -rf .next node_modules && npm ci && npm run build && NODE_ENV=production pm2 restart marchmadness --update-env"`
9. If you fixed a bug: remove it from bugs.md entirely (don't strikethrough, DELETE the line). Keep bugs.md clean.
10. If you completed a task: mark it [x] in PLAN.md and commit.

## Rules
- ONE task or ONE bug per loop. Never combine.
- Do NOT modify deploy_webhook.sh or server.js webhook handler.
- Do NOT modify ralph.sh or PROMPT.md.
- Follow existing code patterns exactly.
- Keep changes minimal — don't refactor unrelated code.
- NEVER push code that doesn't build locally with `npx next build`.
- A 200 from curl is NOT enough — always check that .next/static/chunks has JS files.
- When fixing bugs, remove them from bugs.md entirely once fixed. Do not leave strikethrough entries.
- If a task is unclear, read the relevant spec file in specs/.

## Nova Act Smoke Tests
- Tests are in tests/smoke_test.py using the Nova Act Python SDK
- To run: `source ~/.config/marchmadness.env && python3 tests/smoke_test.py`
- Do NOT write Nova Act auth errors to bugs.md — they are not real bugs
- Do NOT modify the smoke test runner or auth error handling

This agent's config file is at ~/.kiro/agents/marchmadness.json. If asked to update context, edit that file directly.
