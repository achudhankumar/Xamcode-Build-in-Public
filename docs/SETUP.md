# Setup Guide — Xamcode Build in Public

## Prerequisites
- Node.js 20+ LTS
- npm
- Git
- A Supabase project (optional; the app runs in demo mode without one)

## 1. Install dependencies
```bash
npm install
```

## 2. Environment variables
Copy the example template:
```bash
cp .env.example .env.local
```
For live database behavior, set:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Notes:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe to ship to the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. It is used by the waitlist
  insert path and the seed script. It is never sent to the browser.
- The app is considered "configured" only when all three are present. If any is
  missing, the app runs in demo mode and every page shows sample data with a
  "Supabase not configured" badge. No secrets are ever returned to the browser.
- `isSupabaseConfigured` (in `src/lib/supabase/constants.ts`) is the single source
  of truth for this check.

## 3. Apply database migrations
The initial schema lives in `supabase/migrations/001_initial_schema.sql`. It creates:
- `roadmap_items` (public read)
- `progress_records` (public read)
- `changelog_entries` (public read)
- `early_access_signups` (private; public reads blocked)
- Row Level Security policies for the above.

When you have a Supabase project linked:
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```
For local development:
```bash
npx supabase start
npx supabase db push
```

Do not edit an already-applied migration. If a schema change is needed, create a
new migration file instead.

## 4. Seed sample data
The seed script writes public sample records only (roadmap items, progress
milestones, changelog entries). It uses stable identifiers and upserts, so
re-running it never creates duplicates. It does NOT seed signups or private
user data, and sample records are labelled as sample content.

```bash
SUPABASE_URL=https://your-project.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
npm run db:seed
```
If the Supabase variables are missing, the script prints a demo-mode message and
writes nothing.

## 5. Run the app
```bash
npm run dev
```
Then open `http://localhost:3000`.

## 6. Typecheck, test, and production build
```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run
npm run build
npm start
```

## Demo mode vs live mode
- Demo mode: Supabase is not configured. Public pages use clearly-labelled sample
  data and show a "Supabase not configured" badge. No secrets are exposed.
- Live mode: Supabase is configured and migrations applied. Public pages fetch
  real records via the `/api/*` routes. The data-source badge disappears.

## Which operations need authentication / admin privileges
- Public reads (roadmap, progress, changelog) use the service-role client on the
  server only for convenience; the tables also allow public SELECT via RLS.
- Writing waitlist signups (`/api/early-access`) uses the service-role client on
  the server. There is no public read of `early_access_signups`.
- Marking milestones `verified` or flipping `is_verified_completed` is an
  administrative operation. It is NOT exposed through any public endpoint. It
  must be done via admin tooling or direct database access.

## Testing the public pages
1. Open `/roadmap` and test search and each filter button (All, Planned,
   In Progress, Completed, Released, On Hold).
2. Open `/progress` and confirm the summary, weighted percentage, counts, and
   milestone list. With no verified milestones the percent shows 0%, not a
   fabricated number; with no milestones at all it shows a dash.
3. Open `/changelog` and confirm entries render newest first.
4. Open `/health` and `/api/health` to confirm the connectivity check returns a
   coarse configured/reachable/demo_mode summary (no secrets).
5. Open `/early-access` and test validation:
   - submit without email
   - submit with an invalid email
   - submit without consent
   - submit with an invalid interest value
   - submit valid data

If Supabase is not configured, steps 1–3 show sample data, step 5 validates
client- and server-side but returns a server error on the final insert (nothing
is written). To fully exercise live reads and the waitlist insert, configure
Supabase and apply migrations first.

## Progress calculation
Overall progress is computed from weighted milestone records:

```
progress_percent = round( (sum of weights of `verified` milestones)
                          / (sum of all milestone weights) * 100 )
```

- Only `verified` milestones count toward the percentage. `completed` (not yet
  verified) is tracked separately and does NOT count.
- `planned` and `in_progress` are never counted as completed.
- If there are no milestones, `progress_percent` is `null` (rendered as a dash),
  never a fabricated value.
- See `docs/DATABASE_SCHEMA.md` for the full rules.

## Admin dashboard and the first administrator

The admin area lives at `/admin` and is protected twice: middleware redirects
signed-out visitors, and every admin API route re-checks the caller's role from
the `profiles` table server-side. Content tables additionally enforce
`is_strict_admin()` through RLS policies in `supabase/migrations/003_admin_hardening.sql`.

Public signup never grants staff roles. To bootstrap the **first** administrator:

1. Create a normal account through the app (sign-in flow).
2. In the Supabase dashboard (SQL Editor), promote it once:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

This direct SQL path bypasses the `protect_profile_privileges` trigger by design
(there is no `auth.uid()` context). After that, admins can promote others from
**Admin → Roles** in the app — no further SQL needed.

Migration 003 also fixes three privilege issues found in review:

- Users could previously update their **own profile role** (self-elevation). Now
  blocked by trigger unless done by a strict admin or without an auth context.
- Discussion authors could pin/lock their own posts; suggestion authors could
  move their own suggestion's status. Both now require moderator privileges.
- The waitlist table gained admin-only read/update policies so `/admin/signups`
  works without exposing emails publicly.

Apply it with the other migrations (`npx supabase db push`). It only adds
functions, triggers, and policies — no data is modified or dropped.

## Rate limiting

Public write endpoints (waitlist, discussions, replies, suggestions, votes) use
a best-effort in-process limiter (per-IP, per-minute). On a single Node server
this is effective; if you deploy to serverless/multi-instance, the limit is
per-instance, so rely on the database constraints (unique votes, unique emails,
CHECK constraints) as the authoritative protection — they are always enforced.
