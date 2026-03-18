# ESPN Auto-Sync Spec

## ESPN API Research
- Endpoint: `site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard`
- No API key required. Public endpoint.
- No documented rate limit, but community reports suggest ~500 req/min is safe.
- `?groups=100` filters to NCAA Tournament games only.
- `?dates=YYYYMMDD` filters by date.
- Response includes game state: `pre`, `in`, `post` (finished).

## Chosen Approach: Client-Triggered with Server-Side Debounce
- No server.js modifications needed (constraint).
- New API route: `POST /api/auto-sync` — no auth required.
- Server-side debounce: if `results_updated_at` is less than 60 seconds ago, return cached results immediately (no ESPN fetch).
- When stale (>60s), perform the same ESPN sync logic as the admin route.
- Clients call `/api/auto-sync` on page load (bracket, leaderboard, simulate pages) via a shared hook or component.
- Only fetches the current day's ESPN data (not 21 days like admin full sync) for speed.

## Why Not Server-Side Interval
- Would require modifying server.js (forbidden).
- pm2 cron or external cron adds deployment complexity.
- Client-triggered is simpler and only runs when users are active.

## Rate Limiting
- 60-second debounce means max 1 ESPN request per minute regardless of user count.
- In-memory lock prevents concurrent syncs from overlapping requests.
