# Deployment Spec

## Architecture
- Server: 5.78.132.57, nginx reverse proxy, pm2 process manager
- App runs on port 3002, NODE_ENV=production
- SSH: `ssh -i ~/.ssh/vps1.priv root@5.78.132.57`
- App dir: /var/www/MarchMadness
- DB: /var/www/MarchMadness/data/marchmadness.db

## Deploy Flow
- Push to main → GitHub webhook → deploy_webhook.sh
- Script: stop pm2 → git pull → npm ci → rm .next → npm run build → start pm2
- Deploy script uses nohup to survive pm2 stop
- Build failure = pm2 NOT restarted, old build keeps running

## Critical Rules
- NEVER restart pm2 without a successful build
- NEVER push code that doesn't build locally with `npx next build`
- After deploy, verify .next/static/chunks/ exists and has JS files
- A 200 from curl is NOT sufficient verification — chunks must exist
- Concurrent deploys cause race conditions — deploy script uses flock

## Verification After Deploy
1. `curl -s -o /dev/null -w "%{http_code}" https://marchmadness.edgecdec.com` → 200
2. `ssh ... "ls /var/www/MarchMadness/.next/static/chunks/*.js | wc -l"` → should be > 10
3. If chunks missing, build failed silently — rebuild manually
