'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface ProfileRef {
  display_name: string | null;
  username: string | null;
}

interface Discussion {
  id: string;
  title: string;
  body: string;
  category: string;
  is_locked: boolean;
  is_pinned: boolean;
  reply_count: number;
  created_at: string;
  profiles: ProfileRef | null;
}

interface Reply {
  id: string;
  body: string;
  created_at: string;
  profiles: ProfileRef | null;
}

function authorLabel(p: ProfileRef | null): string {
  return p?.display_name || p?.username || 'Unknown';
}

export default function DiscussionDetailClient({ id, signedIn }: { id: string; signedIn: boolean }) {
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/discussions/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load discussion.');
      setDiscussion(json.discussion);
      setReplies(json.replies ?? []);
      setDemoMode(json.demo_mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discussion.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    setReplyError(null);
    setPosting(true);
    try {
      const res = await fetch(`/api/discussions/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(json.errors)
          ? json.errors.map((x: { message: string }) => x.message).join(' ')
          : json.error || 'Failed to post reply.';
        setReplyError(msg);
        return;
      }
      setReplyBody('');
      load();
    } catch {
      setReplyError('A network error occurred.');
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: '#a1a1aa' }}>
        Loading discussion…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ padding: '1.5rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>{error}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>Retry</button>
        </div>
        <p style={{ marginTop: '1rem' }}><Link href="/community" style={{ color: '#3b82f6' }}>← Back to discussions</Link></p>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: '#a1a1aa' }}>
        Discussion not found.
        <p style={{ marginTop: '1rem' }}><Link href="/community" style={{ color: '#3b82f6' }}>← Back to discussions</Link></p>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <p style={{ marginBottom: '1rem' }}>
        <Link href="/community" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}>
          ← Back to discussions
        </Link>
      </p>

      {demoMode && (
        <p style={{ fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', marginBottom: '1rem' }}>
          Demo mode — Supabase not configured
        </p>
      )}

      <article style={{ padding: '1.75rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {discussion.is_pinned && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Pinned</span>}
          {discussion.is_locked && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Locked</span>}
          <span style={{ fontSize: '0.6875rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{discussion.category}</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fafafa', margin: '0 0 0.5rem' }}>{discussion.title}</h1>
        <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0 0 1.25rem' }}>
          by {authorLabel(discussion.profiles)} · {new Date(discussion.created_at).toLocaleString()}
        </p>
        <p style={{ color: '#d4d4d8', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{discussion.body}</p>
      </article>

      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 1rem' }}>
          {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
        </h2>

        {replies.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
            No replies yet.
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {replies.map((r) => (
            <div key={r.id} style={{ padding: '1.25rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0 0 0.5rem' }}>
                {authorLabel(r.profiles)} · {new Date(r.created_at).toLocaleString()}
              </p>
              <p style={{ color: '#d4d4d8', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {discussion.is_locked ? (
        <div style={{ padding: '1.25rem', textAlign: 'center', color: '#f59e0b', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '0.75rem' }}>
          This discussion is locked and no longer accepts replies.
        </div>
      ) : signedIn ? (
        <form onSubmit={handleReply} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '1rem' }}>
          <div>
            <label htmlFor="reply-body" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Your reply</label>
            <textarea id="reply-body" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} rows={4} placeholder="Share your thoughts…" style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none', resize: 'vertical' }} />
          </div>
          {replyError && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{replyError}</p>}
          <button type="submit" disabled={posting} style={{ padding: '0.75rem 1.5rem', background: posting ? '#2563eb' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: posting ? 'not-allowed' : 'pointer', justifySelf: 'start' }}>
            {posting ? 'Posting…' : 'Post reply'}
          </button>
        </form>
      ) : (
        <div style={{ padding: '1.25rem', textAlign: 'center', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          <Link href={`/login?next=/community/${id}`} style={{ color: '#3b82f6', fontWeight: 600 }}>
            Sign in to reply
          </Link>
        </div>
      )}
    </div>
  );
}
