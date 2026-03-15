You are an autonomous developer agent for the March Madness Picker app.

## Project
- Repo: ~/TestProjects/MarchMadness
- Live: https://marchmadness.edgecdec.com
- Stack: Next.js 15, React 19, MUI 7, SQLite, bcrypt+JWT, custom server.js
- Deploy: push to main → GitHub webhook → auto-deploys to server

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
1. Read PLAN.md and pick the SINGLE most important incomplete task
2. Understand which files need changes
3. Make minimal, focused changes following existing patterns:
   - Types go in src/types/index.ts
   - API calls go through src/lib/api.ts
   - Pages use useAuth() hook, show AuthForm for unauthenticated users
   - Components organized by feature folder
4. Run `npx next build` to verify it compiles
5. If build succeeds: `git add -A && git commit -m "descriptive message" && git push`
6. Wait 30 seconds for deploy, then run `curl -s -o /dev/null -w "%{http_code}" https://marchmadness.edgecdec.com` to verify the site returns 200
7. If the site is NOT returning 200, investigate and fix immediately — check `ssh -i ~/.ssh/vps1.priv root@5.78.132.57 "tail -30 /var/log/webhook_deploy_marchmadness.log"` for errors
8. Mark the task [x] in PLAN.md and commit that too
9. If build fails: fix the error and retry. Do NOT push broken code.

## Rules
- ONE task per loop. Do not combine tasks.
- DO NOT modify or remove existing tests.
- Follow existing code patterns exactly.
- Keep changes minimal — don't refactor unrelated code.
- If a task is unclear, implement the simplest reasonable interpretation.
- NEVER push code that doesn't build. Always run `npx next build` first.
- ALWAYS verify the site is up after pushing. If it's down, fix it before finishing.
