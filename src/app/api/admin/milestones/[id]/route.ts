import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateMilestone } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/milestones/[id] — update a milestone, including marking
// it verified (verification stamps come from the authenticated admin, never
// from the request body).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateMilestone(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (!isUuid(body.roadmap_item_id)) {
    return NextResponse.json(
      { errors: [{ field: 'roadmap_item_id', message: 'A valid roadmap item is required.' }] },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const isVerified = body.status === 'verified';
  const patch: Record<string, unknown> = {
    roadmap_item_id: body.roadmap_item_id,
    milestone_type: body.milestone_type,
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : null,
    status: body.status,
    weight: body.weight,
    completed_at: body.status === 'completed' || isVerified ? new Date().toISOString() : null,
    verified_by: isVerified ? guard.user.id : null,
    verified_at: isVerified ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('progress_records').update(patch).eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to update milestone.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/milestones/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase.from('progress_records').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete milestone.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
