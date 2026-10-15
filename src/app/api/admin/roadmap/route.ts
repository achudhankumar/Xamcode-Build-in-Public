import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateRoadmapItem } from '@/lib/validation/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/roadmap — all roadmap items including unpublished ones.
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load roadmap items.' }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/admin/roadmap — create a roadmap item (admin via RLS 003).
export async function POST(request: Request) {
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

  const { data, error } = await supabase
    .from('roadmap_items')
    .insert({
      title: String(body.title).trim(),
      description: String(body.description).trim(),
      status: body.status,
      priority: body.priority,
      category: String(body.category).trim(),
      effort_estimate: body.effort_estimate ? String(body.effort_estimate).trim() : null,
      target_quarter: body.target_quarter ? String(body.target_quarter).trim() : null,
      created_by: guard.user.id,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create roadmap item.' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
