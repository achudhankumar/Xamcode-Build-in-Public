import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateRoadmapItem } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/roadmap/[id] — update a roadmap item (admin).
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

  const errors = validateRoadmapItem(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase
    .from('roadmap_items')
    .update({
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      status: body.status,
      priority: body.priority,
      category: String(body.category).trim(),
      effort_estimate: body.effort_estimate ? String(body.effort_estimate).trim() : null,
      target_quarter: body.target_quarter ? String(body.target_quarter).trim() : null,
      verification_notes: body.verification_notes !== undefined
        ? (body.verification_notes ? String(body.verification_notes).trim() : null)
        : undefined,
      is_verified_completed: typeof body.is_verified_completed === 'boolean'
        ? body.is_verified_completed
        : undefined,
      published_at: body.published !== undefined ? (body.published ? new Date().toISOString() : null) : undefined,
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update roadmap item.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/roadmap/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase.from('roadmap_items').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete roadmap item.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
