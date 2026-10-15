import { NextResponse } from 'next/server';
import { requireModerator } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { SUGGESTION_STATUSES, isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/moderation/suggestions/[id] — change status (moderator+).
// The 003 trigger blocks status changes from non-moderators even if RLS
// would otherwise allow the author's update.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireModerator();
  if (guard.response) return guard.response;

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!SUGGESTION_STATUSES.includes(body.status as (typeof SUGGESTION_STATUSES)[number])) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('suggestions')
    .update({ status: body.status })
    .eq('id', id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Failed to update suggestion.' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Suggestion not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/moderation/suggestions/[id] — remove a suggestion
// (cascades its votes).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireModerator();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase.from('suggestions').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete suggestion.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
