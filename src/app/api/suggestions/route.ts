import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { validateSuggestion } from '@/lib/validation/community';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/suggestions — list suggestions, optionally filtered by status.
export async function GET(request: Request) {
  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ demo_mode: true, suggestions: [] }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const user = await getCurrentUser();

  let query = supabase
    .from('suggestions')
    .select('id, title, body, status, vote_count, created_at, profiles:author_id(display_name, username)')
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: 'Failed to load suggestions.' }, { status: 500 });
  }

  // If signed in, fetch which suggestions the user already voted on.
  let votedIds: string[] = [];
  if (user) {
    const ids = (data ?? []).map((s) => s.id);
    if (ids.length > 0) {
      const { data: votes } = await supabase
        .from('suggestion_votes')
        .select('suggestion_id')
        .eq('user_id', user.id)
        .in('suggestion_id', ids);
      votedIds = (votes ?? []).map((v) => v.suggestion_id);
    }
  }

  return NextResponse.json(
    { demo_mode: false, suggestions: data ?? [], voted_ids: votedIds },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// POST /api/suggestions — submit a suggestion (authenticated only).
export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, 'suggestions-create'), 10, 60000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds) },
    });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to submit a suggestion.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateSuggestion(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Suggestions are unavailable (not configured).' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('suggestions')
    .insert({
      author_id: user.id,
      title: (body.title as string).trim(),
      body: (body.body as string).trim(),
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to submit suggestion.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
