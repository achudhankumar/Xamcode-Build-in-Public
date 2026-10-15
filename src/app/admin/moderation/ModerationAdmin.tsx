'use client';

import { useCallback, useEffect, useState } from 'react';

interface Discussion {
  id: string;
  title: string;
  category: string;
  reply_count: number;
  is_pinned: boolean;
  is_locked: boolean;
  created_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
}

interface Suggestion {
  id: string;
  title: string;
  body: string;
  status: string;
  vote_count: number;
  created_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
}

const SUGGESTION_STATUSES = ['open', 'under_review', 'planned', 'in_progress', 'completed', 'declined'];

function authorLabel(p: { display_name: string | null; username: string | null } | null): string {
  return p?.display_name || p?.username || 'Unknown';
}

export default function ModerationAdmin() {
  const [tab, setTab] = useState<'discussions' | 'suggestions'>('discussions');
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dRes, sRes] = await Promise.all([
        fetch('/api/discussions'),
        fetch('/api/suggestions'),
      ]);
      const dJson = await dRes.json();
      const sJson = await sRes.json();
      if (!dRes.ok) throw new Error(dJson.error || 'Failed to load discussions.');
      setDiscussions(dJson.discussions ?? []);
      if (sRes.ok) setSuggestions(sJson.suggestions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function patchDiscussion(d: Discussion, patch: { is_pinned?: boolean; is_locked?: boolean }, confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(d.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation/discussions/${d.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to update discussion.');
        return;
      }
      setDiscussions((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...patch } : x)));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteDiscussion(d: Discussion) {
    if (!window.confirm(`Delete discussion "${d.title}" and all its replies?`)) return;
    setBusyId(d.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation/discussions/${d.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete discussion.');
        return;
      }
      setDiscussions((prev) => prev.filter((x) => x.id !== d.id));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  async function setSuggestionStatus(s: Suggestion, status: string) {
    setBusyId(s.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation/suggestions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to update suggestion.');
        return;
      }
      setSuggestions((prev) => prev.map((x) => (x.id === s.id ? { ...x, status } : x)));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteSuggestion(s: Suggestion) {
    if (!window.confirm(`Delete suggestion "${s.title}" and its votes?`)) return;
    setBusyId(s.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/moderation/suggestions/${s.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete suggestion.');
        return;
      }
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  const btnStyle = (busy: boolean): React.CSSProperties => ({
    padding: '0.375rem 0.75rem',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '0.375rem',
    color: '#fafafa',
    fontSize: '0.8125rem',
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.6 : 1,
  });

  return (
    <div>
      <div role="tablist" aria-label="Moderation content" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {(['discussions', 'suggestions'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.5rem 1.125rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              border: '1px solid ' + (tab === t ? '#3b82f6' : '#27272a'),
              background: tab === t ? 'rgba(59,130,246,0.15)' : '#111113',
              color: tab === t ? '#93c5fd' : '#a1a1aa',
            }}
          >
            {t === 'discussions' ? 'Discussions' : 'Suggestions'}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" style={{ padding: '0.875rem 1.125rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Loading…</p>
      ) : tab === 'discussions' ? (
        discussions.length === 0 ? (
          <p style={{ color: '#a1a1aa' }}>No discussions.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
            {discussions.map((d) => (
              <li key={d.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#fafafa' }}>
                    {d.is_pinned && <span style={{ color: '#f59e0b', marginRight: '0.375rem' }}>📌</span>}
                    {d.title}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                    {authorLabel(d.profiles)} · {d.category} · {d.reply_count} replies
                    {d.is_locked ? ' · locked' : ''} · {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" disabled={busyId === d.id} onClick={() => patchDiscussion(d, { is_pinned: !d.is_pinned })} style={btnStyle(busyId === d.id)}>
                    {d.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button type="button" disabled={busyId === d.id} onClick={() => patchDiscussion(d, { is_locked: !d.is_locked })} style={btnStyle(busyId === d.id)}>
                    {d.is_locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button type="button" disabled={busyId === d.id} onClick={() => deleteDiscussion(d)} style={{ ...btnStyle(busyId === d.id), color: '#f87171', border: '1px solid rgba(248,113,113,0.4)', background: 'transparent' }}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : suggestions.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No suggestions.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {suggestions.map((s) => (
            <li key={s.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#fafafa' }}>{s.title}</p>
                <p style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{s.body}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                  {authorLabel(s.profiles)} · {s.vote_count} votes · {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label htmlFor={`st-${s.id}`} style={{ fontSize: '0.75rem', color: '#71717a' }}>Status</label>
                <select
                  id={`st-${s.id}`}
                  value={s.status}
                  disabled={busyId === s.id}
                  onChange={(e) => setSuggestionStatus(s, e.target.value)}
                  style={{ padding: '0.375rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem' }}
                >
                  {SUGGESTION_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
                <button type="button" disabled={busyId === s.id} onClick={() => deleteSuggestion(s)} style={{ ...btnStyle(busyId === s.id), color: '#f87171', border: '1px solid rgba(248,113,113,0.4)', background: 'transparent' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
