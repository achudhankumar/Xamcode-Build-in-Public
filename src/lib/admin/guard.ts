import { NextResponse } from 'next/server';
import { getCurrentUser, hasRole, type AppRole, type AuthUser } from '@/lib/auth';

export type GuardResult =
  | { user: AuthUser; response?: undefined }
  | { user?: undefined; response: NextResponse };

/**
 * Server-side authorization for admin routes. Never trusts client-supplied
 * roles: the role always comes from the profiles table via the session.
 */
export async function requireRole(...roles: AppRole[]): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  }
  if (!hasRole(user, ...roles)) {
    return {
      response: NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 },
      ),
    };
  }
  return { user };
}

export const requireModerator = () => requireRole('admin', 'moderator');
export const requireAdmin = () => requireRole('admin');
