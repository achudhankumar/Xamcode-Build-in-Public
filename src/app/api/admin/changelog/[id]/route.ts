import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateChangelogEntry } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/changelog/[id] — edit an entry.
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

  const errors = validateChangelogEntry(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase
    .from('changelog_entries')
    .update({
      version: String(body.version).trim(),
      summary: String(body.summary).trim(),
      body: body.body ? String(body.body).trim() : null,
      features: Array.isArray(body.features) ? body.features : null,
      improvements: Array.isArray(body.improvements) ? body.improvements : null,
      fixes: Array.isArray(body.fixes) ? body.fixes : null,
      limitations: Array.isArray(body.limitations) ? body.limitations : null,
    })
    .eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That version already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update changelog entry.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/changelog/[id]
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid id.' }, { status: 400 });

  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { error } = await supabase.from('changelog_entries').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: 'Failed to delete changelog entry.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
