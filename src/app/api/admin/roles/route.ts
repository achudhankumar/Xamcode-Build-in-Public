import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { APP_ROLES } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// GET /api/admin/roles — list users with roles (admins only).
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: 'Failed to load profiles.' }, { status: 500 });
  }
  return NextResponse.json({ profiles: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// PATCH /api/admin/roles — change a user's role (admins only).
// Guards: admin session required; RLS profiles_admin_update (003) requires
// strict admin; the 003 trigger raises if anything else tries a role change.
// Admins cannot demote themselves, so an account can never lock itself out.
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  let body: { user_id?: unknown; role?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isUuid(body.user_id)) {
    return NextResponse.json({ error: 'A valid user id is required.' }, { status: 400 });
  }
  if (!APP_ROLES.includes(body.role as (typeof APP_ROLES)[number])) {
    return NextResponse.json({ error: 'Invalid role value.' }, { status: 400 });
  }
  if (body.user_id === guard.user.id) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ role: body.role })
    .eq('id', body.user_id as string)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Failed to update role.' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
