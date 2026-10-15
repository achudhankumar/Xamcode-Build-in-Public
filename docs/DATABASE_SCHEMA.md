# Database Schema

This document describes the schema in `supabase/migrations/001_initial_schema.sql`.

## Tables

### roadmap_items
Public-facing roadmap entries.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| title | text | Required |
| description | text | Required |
| status | text | `planned`, `in_progress`, `completed`, `released`, `on_hold` |
| priority | text | `low`, `medium`, `high`, `critical` |
| category | text | Required |
| effort_estimate | text | Optional |
| target_quarter | text | Optional |
| verification_notes | text | Optional |
| is_verified_completed | boolean | Default `false`; only admins should change this |
| contributor_id | uuid | Optional |
| created_by | uuid | Defaults to `auth.uid()` |
| created_at | timestamptz | Default now |
| updated_at | timestamptz | Default now |
| published_at | timestamptz | Optional |

### progress_records
Milestone work items linked to a roadmap item.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| roadmap_item_id | uuid | FK to `roadmap_items.id`, cascade |
| milestone_type | text | `feature`, `improvement`, `fix`, `verification`, `release` |
| title | text | Required |
| description | text | Optional |
| status | text | `planned`, `in_progress`, `completed`, `verified` |
| weight | numeric | 0–100 |
| completed_at | timestamptz | When the work was completed |
| verified_by | uuid | Admin who verified |
| verified_at | timestamptz | When verified |
| link | text | Optional reference |
| created_by | uuid | Default `auth.uid()` |
| created_at | timestamptz | Default now |
| updated_at | timestamptz | Default now |

### changelog_entries
Versioned release notes.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| version | text | Required, unique |
| published_at | timestamptz | Default now |
| summary | text | Required |
| body | text | Optional |
| features | jsonb | Optional |
| improvements | jsonb | Optional |
| fixes | jsonb | Optional |
| limitations | jsonb | Optional |
| created_by | uuid | Default `auth.uid()` |
| created_at | timestamptz | Default now |
| updated_at | timestamptz | Default now |

### early_access_signups
Private waitlist registrations.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | PK |
| email | text | Required, unique |
| display_name | text | Optional |
| interest | text | `general`, `features`, `testing`, `documentation`, `other` |
| opted_in_at | timestamptz | When the user opted in |
| status | text | `pending`, `confirmed`, `unsubscribed`, `bounced` |
| confirmation_token | text | Unique, optional |
| confirmed_at | timestamptz | Optional |
| created_at | timestamptz | Default now |
| updated_at | timestamptz | Default now |

## Progress calculation

The public progress percentage is calculated from weighted milestone records in
`progress_records` (see `computeProgressSummary` in `src/lib/db/progress.ts`):

```
progress_percent = round( (sum of weights of `verified` milestones)
                          / (sum of all milestone weights) * 100 )
```

Rules:
- Only milestones with status `verified` count toward the numerator.
- `completed` milestones that are not yet `verified` are tracked separately and
  do NOT count toward the percentage. `planned` and `in_progress` are never
  counted as completed.
- The denominator is the sum of all milestone weights (each weight is 0–100).
- If there are no milestones, `progress_percent` is `null` and the progress page
  renders a dash instead of a fabricated percentage.
- The counts shown (completed, in-progress, planned) are derived from the same
  records: `completion_count` covers `completed` + `verified`.

## Public API operations

| Route | Method | Purpose | Auth |
| --- | --- | --- | --- |
| `/api/roadmap` | GET | List/filter roadmap items (status + search) | public read |
| `/api/progress` | GET | Milestones + weighted progress summary | public read |
| `/api/changelog` | GET | Changelog entries, newest first | public read |
| `/api/health` | GET | Coarse configured/reachable/demo-mode check | public |
| `/api/db-status` | GET | Same connectivity summary (alias) | public |
| `/api/early-access` | POST | Validate + insert a waitlist signup | public insert (server-side only) |

There is no public endpoint to modify milestones or flip `is_verified_completed`.
Verified progress can only be changed through admin tooling or direct DB access.

## Constraints
- Status and enum-like columns use `CHECK` constraints.
- `progress_records.weight` is constrained between 0 and 100.
- Counts such as `reply_count` and `vote_count` are constrained to be non-negative in the broader schema.
- Unique constraints exist on `changelog_entries.version`, `early_access_signups.email`, `early_access_signups.confirmation_token`.
