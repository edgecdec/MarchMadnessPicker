# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 22:36] ~~**Save bracket fails**: "JSON.parse: unexpected end of data at line 1 column 1 of the JSON data" when trying to save bracket picks.~~ **FIXED 2026-03-14**: Root cause was the deploy script stopping pm2 before building, causing 502s from nginx. Fixed deploy script to build while app runs and only restart after successful build. Added lock file to prevent concurrent deploys.
