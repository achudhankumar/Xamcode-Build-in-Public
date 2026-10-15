# Security Notes

## Secret handling
- `SUPABASE_SERVICE_ROLE_KEY` is never shipped to the browser.
- Browser code uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Environment files (`.env.local`) are gitignored.

## Access control
- Public pages may read `roadmap_items`, `progress_records`, and `changelog_entries`.
- Public pages cannot read `early_access_signups`.
- Waitlist signups are created through a server-side endpoint using the service role client, not through direct browser writes.
- Verified progress and `is_verified_completed` changes are administrative operations and should not be exposed to public visitors.

## Input validation
- Waitlist submissions are validated client-side and server-side.
- Email validation rejects malformed addresses before any database write.
- Duplicate emails are rejected by the database unique constraint and returned as a friendly error.

## Input validation (server-side)
- `/api/early-access` re-validates every field on the server; client-side checks
  are a convenience only.
- Email format and length are checked before any write. An unknown `interest`
  value is rejected with a 400 rather than silently coerced.
- Duplicate emails are rejected by the `early_access_signups.email` unique
  constraint and returned as a friendly 409.
- The `early_access_signups` table has no public SELECT policy, so signup emails
  are never readable by public clients.

## Rate limiting
- The current implementation does not include automated rate limiting for the
  waitlist endpoint, because that generally requires shared infrastructure
  (e.g. Redis or an edge/WAF rule) that is out of scope for this phase.
- Concrete mitigation before deploying: place the site behind a platform or
  reverse proxy that limits POST requests to `/api/early-access` per IP (for
  example Cloudflare Rate Limiting, or a Vercel/edge middleware throttle).
- A lightweight in-process per-IP limiter can be added later, but it is not
  durable across serverless instances and is not a substitute for an
  infrastructure-level control.

## Logging
- Submitted personal information should not be logged unnecessarily.
- Server errors are logged in a generic way; email addresses and interest values are not echoed into logs by default.

## Demo mode
- When Supabase is not configured, the app runs in demo mode.
- Demo mode does not create realistic signups or expose secrets.
- Sample data is clearly labeled as sample data and does not claim planned features are completed.
