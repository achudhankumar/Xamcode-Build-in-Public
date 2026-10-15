import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { SIGNUP_STATUSES } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// GET /api/admin/signups — private early-access waitlist (admins only).
// The RLS policy in 003 restricts SELECT to strict admins; this guard
// keeps unauthenticated callers out before any query runs.
export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabase
    .from('early_access_signups')
    .select('id, email, display_name, interest, status, opted_in_at, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to load signups.' }, { status: 500 });
  }

  return NextResponse.json({ signups: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// PATCH /api/admin/signups — update a signup's status (e.g. confirmed).
export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  let body: { id?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!isUuid(body.id)) {
    return NextResponse.json({ error: 'A valid signup id is required.' }, { status: 400 });
  }
  if (!SIGNUP_STATUSES.includes(body.status as (typeof SIGNUP_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const patch: Record<string, unknown> = { status: body.status };
  if (body.status === 'confirmed') {
    patch.confirmed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('early_access_signups').update(patch).eq('id', body.id as string);
  if (error) {
    return NextResponse.json({ error: 'Failed to update signup.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
