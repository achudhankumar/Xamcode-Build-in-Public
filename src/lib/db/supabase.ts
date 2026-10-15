import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  isSupabasePublicConfigured,
  isSupabaseServiceConfigured,
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  SERVICE_ROLE_KEY,
} from '@/lib/supabase/constants';

export interface HealthResult {
  configured: boolean;
  reachable: boolean;
  demo_mode: boolean;
  error: string | null;
}

/**
 * Server-side client for PUBLIC reads (roadmap, progress, changelog, etc.).
 *
 * Uses the publishable/anon key so public content does NOT require the
 * service-role key. RLS restricts these tables to public SELECT only. Returns
 * `undefined` when the public config is missing (demo mode). Server-only.
 */
export function getSupabaseServerClientOrUndefined(): SupabaseClient | undefined {
  if (!isSupabasePublicConfigured) {
    return undefined;
  }

  return createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Privileged server-side client using the service-role key. Bypasses RLS —
 * only for trusted server operations (waitlist inserts, admin writes, role
 * checks). Throws when the service-role key is missing. Never send to browser.
 */
export function getServiceRoleClientOrUndefined(): SupabaseClient | undefined {
  if (!isSupabaseServiceConfigured) {
    return undefined;
  }

  return createClient(PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Safe connectivity check. Never returns secret values — only a coarse
 * configured / reachable / demo-mode summary plus a generic error message.
 *
 * An empty table is treated as reachable (not an error), because a freshly
 * migrated database with no rows is a valid, healthy state.
 */
export async function getDbHealth(): Promise<HealthResult> {
  if (!isSupabasePublicConfigured) {
    return { configured: false, reachable: false, demo_mode: true, error: null };
  }

  try {
    const client = getSupabaseServerClientOrUndefined();
    if (!client) {
      return { configured: false, reachable: false, demo_mode: true, error: null };
    }

    const { error } = await client.from('roadmap_items').select('id').limit(1);

    if (error) {
      return { configured: true, reachable: false, demo_mode: false, error: 'Database query failed.' };
    }

    return { configured: true, reachable: true, demo_mode: false, error: null };
  } catch {
    return {
      configured: true,
      reachable: false,
      demo_mode: false,
      error: 'An unexpected error occurred while checking the database.',
    };
  }
}

// Backwards-compatible alias used by earlier code paths.
export const getHealth = getDbHealth;
