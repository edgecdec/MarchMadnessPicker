# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 23:10] **Site shows black page after deploy**: The `.next/` directory on the server is empty — the deploy wiped it but the build either failed or hasn't completed. The site serves HTML but all JS chunks return 400, so React never hydrates and the page is blank. Likely cause: concurrent deploys racing (two webhooks fire close together, one wipes `.next` while the other is building). Fix: add a lock file to deploy_webhook.sh to prevent concurrent deploys — `flock /tmp/marchmadness-deploy.lock bash deploy_webhook.sh`. Also verify the build succeeded before restarting pm2. Immediate fix: SSH in and run `pm2 stop marchmadness && rm -rf .next && npm run build && NODE_ENV=production pm2 restart marchmadness --update-env`.

- [2026-03-14 22:55] ~~**Save bracket fails**: JSON.parse error when clicking Save Picks.~~ **FIXED** — uuid import issue in picks route.
