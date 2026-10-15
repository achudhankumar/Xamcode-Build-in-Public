import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { isUuid } from '@/lib/validation/community';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// POST /api/suggestions/[id]/vote — cast a vote (authenticated only).
// The DB unique(suggestion_id, user_id) constraint prevents duplicate votes.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(clientKey(request, 'votes'), 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds) },
    });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid suggestion id.' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to vote.' }, { status: 401 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Voting is unavailable (not configured).' }, { status: 503 });
  }

  // Check for an existing vote to give a clear duplicate response.
  const { data: existing } = await supabase
    .from('suggestion_votes')
    .select('id')
    .eq('suggestion_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'You have already voted on this suggestion.' }, { status: 409 });
  }

  const { error } = await supabase
    .from('suggestion_votes')
    .insert({ suggestion_id: id, user_id: user.id });

  if (error) {
    // Unique violation (race) → treat as already voted.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already voted on this suggestion.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to record vote.' }, { status: 500 });
  }

  // Return the fresh count.
  const { data: suggestion } = await supabase
    .from('suggestions')
    .select('vote_count')
    .eq('id', id)
    .maybeSingle();

  return NextResponse.json({ vote_count: suggestion?.vote_count ?? null }, { status: 201 });
}

// DELETE /api/suggestions/[id]/vote — remove the user's vote.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(clientKey(request, 'votes'), 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds) },
    });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid suggestion id.' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Voting is unavailable (not configured).' }, { status: 503 });
  }

  const { error } = await supabase
    .from('suggestion_votes')
    .delete()
    .eq('suggestion_id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to remove vote.' }, { status: 500 });
  }

  const { data: suggestion } = await supabase
    .from('suggestions')
    .select('vote_count')
    .eq('id', id)
    .maybeSingle();

  return NextResponse.json({ vote_count: suggestion?.vote_count ?? null }, { status: 200 });
}
