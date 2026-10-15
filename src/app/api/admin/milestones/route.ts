import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/guard';
import { createServerClient } from '@/lib/supabase/server';
import { validateMilestone } from '@/lib/validation/admin';
import { isUuid } from '@/lib/validation/community';

export const dynamic = 'force-dynamic';

// GET /api/admin/milestones — all progress records for management.
export async function GET() {
  const guard = await requireAdmin();
  if (guard.response) return guard.response;

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Admin tools require Supabase configuration.' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('progress_records')
    .select('*, roadmap_items(title)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to load milestones.' }, { status: 500 });
  }
  return NextResponse.json({ milestones: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

// POST /api/admin/milestones — record a milestone. Verification fields
// (status 'verified', verified_by/at) are set server-side only.
export async function POST(request: Request) {
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
  const { data, error } = await supabase
    .from('progress_records')
    .insert({
      roadmap_item_id: body.roadmap_item_id,
      milestone_type: body.milestone_type,
      title: String(body.title).trim(),
      description: body.description ? String(body.description).trim() : null,
      status: body.status,
      weight: body.weight,
      completed_at: body.status === 'completed' || isVerified ? new Date().toISOString() : null,
      verified_by: isVerified ? guard.user.id : null,
      verified_at: isVerified ? new Date().toISOString() : null,
      created_by: guard.user.id,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create milestone.' }, { status: 500 });
  }
  return NextResponse.json({ id: data.id }, { status: 201 });
}
