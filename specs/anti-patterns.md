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

## Dark/Light Mode
- NEVER use hardcoded hex colors in components (e.g. `color: "#fff"`, `background: "#1e1e1e"`)
- ALWAYS use MUI theme tokens: `text.primary`, `text.secondary`, `background.default`, `background.paper`, `divider`, `primary.main`, `action.hover`, etc.
- For custom colors that need to differ between modes, use `theme.palette.mode === 'dark' ? darkValue : lightValue` or define them in the theme's palette
- When creating new components, test them in BOTH dark and light mode before committing
- The bracket export must also respect the current theme — don't hardcode export colors separately
- Common mistakes: hardcoded `#fff`/`#000` text, hardcoded `rgba()` backgrounds, hardcoded border colors, inline `sx` styles with literal color values

## Iteration Discipline
- STRICTLY ONE bug or ONE task per iteration. NEVER combine multiple fixes into one commit.
- If you fix a bug and notice another bug, log it in bugs.md and move on. Do NOT fix it in the same iteration.
- If a task description mentions multiple things, pick the FIRST one only. Leave the rest for the next iteration.
- Each commit should have exactly ONE logical change. "Fix X and Y and Z" is WRONG. "Fix X" is correct.
- This rule exists because multi-fix commits are harder to debug when something breaks.

## Task Completion
- If a task has multiple parts and you only complete the first part, split the task: mark what you did as done (or delete it from bugs.md), and create a NEW entry for the remaining work. Do NOT leave the original task unchanged — this causes infinite loops where you keep re-reading the same task and redoing the completed part.

## Local Server
- NEVER start a local dev server. Do NOT run `node server.js`, `npm run dev`, or `bash dev.sh` locally. It gets stuck and blocks the iteration.
- This app deploys to a REMOTE server via git push. After pushing, the webhook auto-deploys.
- You CAN and SHOULD use SSH to check the server, run DB queries, check logs, or debug issues. See ~/.config/marchmadness-server.env for connection details.
- To verify deploy: `source ~/.config/marchmadness-server.env && ssh -i $SSH_KEY $SSH_HOST "commands here"`
- To verify: `sleep 60 && curl -s -o /dev/null -w "%{http_code}" https://marchmadness.edgecdec.com` and check chunks per @specs/deployment.md.
