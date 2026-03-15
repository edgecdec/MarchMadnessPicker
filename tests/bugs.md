# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 22:55] ~~**Save bracket fails**: "JSON.parse: unexpected end of data at line 1 column 1 of the JSON data" when clicking Save Picks on the bracket page. The POST /api/picks endpoint is returning an empty or non-JSON response. This was NOT fixed by the deploy script changes — the API route itself is broken. Test with: `curl -s -X POST http://localhost:3003/api/picks -H "Content-Type: application/json" -d '{"tournament_id":"test","picks_data":{"East-0-0":"Duke"}}'` and verify it returns valid JSON.~~ **FIXED 2026-03-14 23:06** — Moved `uuid` from dynamic `require()` to top-level ES import, added try/catch error handling to POST handler.
