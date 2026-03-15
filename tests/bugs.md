# Bugs Found by Automated Testing

Bugs discovered by Nova Act smoke tests during Ralph development loops.

- [2026-03-14 22:36] **Save bracket fails**: "JSON.parse: unexpected end of data at line 1 column 1 of the JSON data" when trying to save bracket picks. Likely the /api/picks POST endpoint is returning an empty or non-JSON response.
