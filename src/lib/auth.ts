import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';

export type AppRole = 'member' | 'moderator' | 'admin';

export interface AuthUser {
  id: string;
  email: string | null;
  role: AppRole;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

/** Returns the signed-in user with their profile role, or null when signed out. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();

  // Defend against both "no session" and unexpected error paths.
  if (error || !data || !data.user) {
    return null;
  }
  const user = data.user;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name, username, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    // Default to member if the profile row is missing; never trust client input.
    role: (profile?.role as AppRole) ?? 'member',
    display_name: profile?.display_name ?? null,
    username: profile?.username ?? null,
    avatar_url: profile?.avatar_url ?? null,
  };
}

export function hasRole(user: AuthUser | null, ...roles: AppRole[]): boolean {
  return !!user && roles.includes(user.role);
}

export function isAdmin(user: AuthUser | null): boolean {
  return hasRole(user, 'admin');
}

export function isModeratorOrAbove(user: AuthUser | null): boolean {
  return hasRole(user, 'admin', 'moderator');
}

/**
 * Throws when the Supabase client cannot be created (missing public config).
 * Used by route handlers that require a live connection.
 */
export async function requireSupabase(): Promise<SupabaseClient> {
  const supabase = await createServerClient();
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }
  return supabase;
}
