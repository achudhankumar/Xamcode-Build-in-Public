import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  isSupabasePublicConfigured,
} from '@/lib/supabase/constants';

/**
 * Cookie-based Supabase client for Server Components, Route Handlers, and
 * Server Actions. Uses the publishable/anon key; RLS scopes access by the
 * signed-in user. Returns `undefined` when public config is missing.
 *
 * In Next.js 15 `cookies()` is async.
 */
export async function createServerClient() {
  if (!isSupabasePublicConfigured) {
    return undefined;
  }

  const cookieStore = await cookies();

  return createSupabaseServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The `setAll` method was called from a Server Component. This can be
          // ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
