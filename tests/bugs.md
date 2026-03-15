# Bugs — Fix these BEFORE working on any PLAN.md tasks

- **CRITICAL - .next/static missing on server**: The server's .next directory has no static/ folder — all JS chunks return 400, site is completely broken. Do a full clean rebuild on server: `ssh -i ~/.ssh/vps1.priv root@5.78.132.57 "cd /var/www/MarchMadness && pm2 stop marchmadness && rm -rf .next node_modules && npm ci && npm run build && NODE_ENV=production pm2 restart marchmadness --update-env"`. Then verify chunks exist: `ssh -i ~/.ssh/vps1.priv root@5.78.132.57 "ls /var/www/MarchMadness/.next/static/chunks/*.js | wc -l"` must be > 10.

- **Bracket tabs don't switch**: On /bracket, clicking different bracket tabs always displays the first bracket instead of switching. The tab click handler isn't updating which bracket's picks are passed to the Bracket component.

- **Leaderboard missing upset bonus in round breakdown**: Total score includes upset bonuses correctly but the round-by-round columns don't. The per-round scores add up to less than the total. Fix: include upset bonus points in each round's column total.

- **Viewing own bracket at /bracket/[username] says "picks are locked"**: Should redirect to /bracket (editable) when the logged-in user views their own username.

- **No unsaved changes warning on bracket page**: Navigating away from bracket page with unsaved picks loses them silently. Add beforeunload event and route change interceptor.

- **Autofill overwrites existing picks**: Smart/Chalk/Random should only fill empty game slots, not overwrite existing picks.

- **Autofill should be a dropdown with descriptions**: Replace separate buttons with a single dropdown menu (Smart → Random → Chalk). Each option shows tooltip on hover explaining how it works.

- **Bracket PNG export unreadable**: Export has white background but dark theme text colors. Force dark text on white background when rendering export.

- **User profile missing group links and bracket details**: Profile page should show groups as clickable links, each showing which brackets are entered in that group.
