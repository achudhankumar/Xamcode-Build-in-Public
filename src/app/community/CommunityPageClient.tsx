'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface DiscussionRow {
  id: string;
  title: string;
  category: string;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
}

const CATEGORIES = ['all', 'general', 'feedback', 'help', 'showcase', 'announcements'];

function authorLabel(p: DiscussionRow['profiles']): string {
  return p?.display_name || p?.username || 'Unknown';
}

export default function CommunityPageClient({ signedIn }: { signedIn: boolean }) {
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [formCategory, setFormCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = category !== 'all' ? `?category=${category}` : '';
      const res = await fetch(`/api/discussions${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load.');
      setDiscussions(json.discussions ?? []);
      setDemoMode(json.demo_mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, category: formCategory }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(json.errors)
          ? json.errors.map((x: { message: string }) => x.message).join(' ')
          : json.error || 'Failed to create discussion.';
        setFormError(msg);
        return;
      }
      setTitle('');
      setBody('');
      setShowForm(false);
      load();
    } catch {
      setFormError('A network error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.5rem' }}>
            Community Discussions
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
            Discuss product ideas and share feedback.
          </p>
        </div>
        {signedIn ? (
          <button type="button" onClick={() => setShowForm((s) => !s)} style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? 'Close' : 'Start a Discussion'}
          </button>
        ) : (
          <Link href="/login?next=/community" style={{ padding: '0.625rem 1.25rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
            Sign in to post
          </Link>
        )}
      </header>

      {demoMode && (
        <p style={{ fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', marginBottom: '1rem' }}>
          Demo mode — Supabase not configured
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="d-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Title</label>
            <input id="d-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you want to discuss?" style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none' }} />
          </div>
          <div>
            <label htmlFor="d-body" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Details</label>
            <textarea id="d-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none', resize: 'vertical' }} />
          </div>
          <div>
            <label htmlFor="d-cat" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Category</label>
            <select id="d-cat" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} style={{ padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none' }}>
              {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {formError && <p style={{ color: '#ef4444', margin: 0, fontSize: '0.875rem' }}>{formError}</p>}
          <button type="submit" disabled={submitting} style={{ padding: '0.75rem 1.5rem', background: submitting ? '#2563eb' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', justifySelf: 'start' }}>
            {submitting ? 'Posting…' : 'Post discussion'}
          </button>
        </form>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} style={{ padding: '0.375rem 0.875rem', background: category === c ? '#3b82f6' : 'transparent', color: category === c ? '#fff' : '#a1a1aa', border: '1px solid ' + (category === c ? '#3b82f6' : '#27272a'), borderRadius: '9999px', fontSize: '0.8125rem', cursor: 'pointer', textTransform: 'capitalize' }}>
          {c}
        </button>
      ))}
      </div>

      {loading && <div style={{ padding: '2.5rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>Loading discussions…</div>}

      {!loading && error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>{error}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {!loading && !error && discussions.length === 0 && (
        <div style={{ padding: '2.5rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          No discussions yet. Be the first to start one!
        </div>
      )}

      {!loading && !error && discussions.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
          {discussions.map((d) => (
            <li key={d.id} style={{ background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
              <Link href={`/community/${d.id}`} style={{ display: 'block', padding: '1.25rem', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                  {d.is_pinned && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Pinned</span>}
                  {d.is_locked && <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>Locked</span>}
                  <span style={{ fontSize: '0.6875rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{d.category}</span>
                </div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.375rem' }}>{d.title}</h2>
                <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: 0 }}>
                  by {authorLabel(d.profiles)} · {d.reply_count} {d.reply_count === 1 ? 'reply' : 'replies'} · {new Date(d.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
