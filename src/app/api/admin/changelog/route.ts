import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateChangelogEntry } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/changelog — all entries for management.
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('changelog_entries')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load changelog entries.' }, { status: 500 });
  }
  return NextResponse.json({ entries: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/admin/changelog — publish a changelog entry.
export async function POST(request: Request) {
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

  const { data, error } = await supabase
    .from('changelog_entries')
    .insert({
      version: String(body.version).trim(),
      summary: String(body.summary).trim(),
      body: body.body ? String(body.body).trim() : null,
      features: Array.isArray(body.features) ? body.features : null,
      improvements: Array.isArray(body.improvements) ? body.improvements : null,
      fixes: Array.isArray(body.fixes) ? body.fixes : null,
      limitations: Array.isArray(body.limitations) ? body.limitations : null,
      created_by: guard.user.id,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That version already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create changelog entry.' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
