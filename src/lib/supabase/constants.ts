// Supabase environment configuration.
//
// Public reads (roadmap, progress, changelog) only need the project URL and a
// publishable key (modern `sb_publishable_...` or legacy `anon` key). They must
// NOT require the service-role key. Privileged server-side writes (waitlist
// inserts, admin operations, role checks) additionally need the service-role
// key, which stays server-only.

export const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** True when the project URL and a publishable/anon key are present. */
export const isSupabasePublicConfigured = Boolean(
  PUBLIC_SUPABASE_URL && PUBLIC_SUPABASE_ANON_KEY,
);

/** True when the server-only service-role key is present. */
export const isSupabaseServiceConfigured = Boolean(
  PUBLIC_SUPABASE_URL && SERVICE_ROLE_KEY,
);

/**
 * Backwards-compatible flag used to gate demo mode on public pages.
 *
 * Public content only needs the publishable key, so demo mode is off whenever
 * the public config is present — the service-role key is NOT required to read
 * public data.
 */
export const isSupabaseConfigured = isSupabasePublicConfigured;

/** True when the app should run in demo mode (public config missing). */
export const isDemoMode = !isSupabasePublicConfigured;
