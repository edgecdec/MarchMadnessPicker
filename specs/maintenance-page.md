# Maintenance Page During Deployments

## Problem
During deploys, pm2 is stopped for ~30-60s while the app rebuilds. Users hitting the site get nginx 502 errors.

## Chosen Approach: nginx `error_page` with static HTML
The simplest solution that requires zero changes to deploy_webhook.sh or server.js.

### How it works
1. Place a static `/var/www/MarchMadness/maintenance.html` file on the server.
2. Add to the nginx `server` block:
   ```nginx
   error_page 502 503 504 /maintenance.html;
   location = /maintenance.html {
       root /var/www/MarchMadness;
       internal;
   }
   ```
3. When pm2 is stopped (upstream down), nginx gets a 502 from the proxy and serves `maintenance.html` instead — automatically, no deploy script changes needed.
4. When pm2 restarts, nginx proxies normally again — no manual switchback.

### Pros
- Zero changes to deploy_webhook.sh (anti-pattern rule: never modify it)
- Automatic — no "swap config" step that could fail or get stuck
- Works for any downtime, not just deploys (crashes, restarts, etc.)
- Static HTML with inline CSS — no external dependencies that could fail

### Cons
- Returns 502 status code (not 200) — but this is semantically correct for maintenance
- Users who were mid-action lose their state — but this is unavoidable during deploys

### Alternatives Considered
- **Deploy script swaps nginx config**: More complex, requires modifying deploy_webhook.sh (forbidden), risk of getting stuck in maintenance mode if deploy fails.
- **Service worker caching**: Complex, unreliable for first-time visitors, hard to invalidate.
- **Zero-downtime deploy (build before stopping pm2)**: Would require significant deploy script changes. Could be a future improvement but out of scope.

## Implementation
1. Create `maintenance.html` — simple branded page with "Under maintenance, check back shortly" message. Inline all CSS. Use the app's dark theme colors. Include a meta refresh every 10 seconds so users auto-retry.
2. Update nginx config to add the `error_page` directive.
3. Reload nginx: `nginx -t && systemctl reload nginx`.
4. Test by stopping pm2 and hitting the site.
