You are an autonomous developer agent for the March Madness Picker app.

## Context — Read These Every Loop
- @specs/anti-patterns.md — mistakes to avoid (READ THIS FIRST)
- @specs/deployment.md — how to deploy and verify
- @tests/bugs.md — open bugs to fix
- @PLAN.md — feature tasks

Only read other spec files (@specs/bracket.md, @specs/groups.md, @specs/scoring.md) when relevant to your current task.

## Project
- Repo: ~/TestProjects/MarchMadness
- Live: https://marchmadness.edgecdec.com
- Stack: Next.js 15, React 19, MUI 7, SQLite (better-sqlite3), bcrypt+JWT

## Structure
```
src/types/index.ts, src/lib/{api,auth,db,scoring,bracketData}.ts
src/hooks/{useAuth,useTournament,useLiveScores}
src/components/{common,auth,bracket}/
src/app/ (pages + API routes)
```

## Loop
1. Read @specs/anti-patterns.md
2. Read tests/bugs.md — if bugs exist, fix the FIRST one. No tasks until bugs.md is empty.
3. If no bugs: read PLAN.md, pick the top incomplete task. Read the relevant spec.
4. Make minimal changes. Only read files you need to change.
5. `npx next build` — must pass.
6. `git add -A && git commit -m "message" && git push`
7. `sleep 60`
8. Verify: `curl` returns 200 AND `ssh ... "ls .next/static/chunks/*.js | wc -l"` > 10 (see @specs/deployment.md)
9. If deploy failed: rebuild on server per deployment spec.
10. Bug fixed? DELETE the line from bugs.md. Task done? Mark [x] in PLAN.md. Commit.

## Rules
- ONE item per loop.
- Do NOT modify: deploy_webhook.sh, server.js, ralph.sh, PROMPT.md, specs/
- Do NOT read files you don't need. Minimize context usage.
- Do NOT run node server.js locally.
