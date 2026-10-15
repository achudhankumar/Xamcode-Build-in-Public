import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { validateReply, isUuid } from '@/lib/validation/community';
import { rateLimit, clientKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/discussions/[id] — a single discussion with its replies.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid discussion id.' }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ demo_mode: true, discussion: null, replies: [] }, { status: 200 });
  }

  const { data: discussion, error } = await supabase
    .from('discussions')
    .select('id, title, body, category, is_locked, is_pinned, reply_count, created_at, profiles:author_id(display_name, username, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load discussion.' }, { status: 500 });
  }
  if (!discussion) {
    return NextResponse.json({ error: 'Discussion not found.' }, { status: 404 });
  }

  const { data: replies, error: repliesError } = await supabase
    .from('discussion_replies')
    .select('id, body, created_at, profiles:author_id(display_name, username, avatar_url)')
    .eq('discussion_id', id)
    .order('created_at', { ascending: true });

  if (repliesError) {
    return NextResponse.json({ error: 'Failed to load replies.' }, { status: 500 });
  }

  return NextResponse.json(
    { demo_mode: false, discussion, replies: replies ?? [] },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

// POST /api/discussions/[id] — add a reply (authenticated only).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = rateLimit(clientKey(request, 'replies-create'), 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(limited.retryAfterSeconds) },
    });
  }

  const { id } = await params;

  if (!isUuid(id)) {
    return NextResponse.json({ error: 'Invalid discussion id.' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must be signed in to reply.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const errors = validateReply(body);
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const supabase = await createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Replies are unavailable (not configured).' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('discussion_replies')
    .insert({
      discussion_id: id,
      author_id: user.id,
      body: (body.body as string).trim(),
    })
    .select('id')
    .single();

  if (error) {
    // A locked discussion rejects inserts via RLS; surface a clear message.
    if (error.code === '42501' || /locked/i.test(error.message)) {
      return NextResponse.json({ error: 'This discussion is locked.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to post reply.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
