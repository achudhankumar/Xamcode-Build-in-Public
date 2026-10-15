import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { validateDiscussion, type DiscussionCategory } from '@/lib/validation/community';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/discussions — list discussions (optionally by category).
export async function GET(request: Request) {
  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ demo_mode: true, discussions: [] }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('discussions')
    .select('id, title, category, reply_count, is_pinned, is_locked, created_at, profiles:author_id(display_name, username, avatar_url)')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to load discussions.' }, { status: 500 });
  }

  return NextResponse.json(
    { demo_mode: false, discussions: data ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// POST /api/discussions — create a discussion (authenticated only).
export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, 'discussions-create'), 10, 60000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds) },
    });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to start a discussion.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateDiscussion(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Discussions are unavailable (not configured).' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('discussions')
    .insert({
      author_id: user.id,
      title: (body.title as string).trim(),
      body: (body.body as string).trim(),
      category: (body.category as DiscussionCategory) || 'general',
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create discussion.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
