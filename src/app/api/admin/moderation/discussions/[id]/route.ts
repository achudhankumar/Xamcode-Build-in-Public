import { NextResponse } from 'next/server';
import { requireModerator } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/moderation/discussions/[id] — pin/lock/unpin/unlock.
// RLS (002) + the 003 trigger both restrict moderation flags to moderators.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireModerator();
  if (guard.response) return guard.response;

  let body: { is_pinned?: unknown; is_locked?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.is_pinned === 'boolean') patch.is_pinned = body.is_pinned;
  if (typeof body.is_locked === 'boolean') patch.is_locked = body.is_locked;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('discussions')
    .update(patch)
    .eq('id', id)
    .select('id');

  if (error) {
    return NextResponse.json({ error: 'Failed to update discussion.' }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Discussion not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/moderation/discussions/[id] — remove a discussion.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireModerator();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase.from('discussions').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete discussion.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
