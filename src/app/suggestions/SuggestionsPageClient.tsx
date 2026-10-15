'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface SuggestionRow {
  id: string;
  title: string;
  body: string;
  status: string;
  vote_count: number;
  created_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
}

const STATUS_FILTERS = ['all', 'open', 'under_review', 'planned', 'in_progress', 'completed', 'declined'];

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  under_review: 'Under review',
  planned: 'Planned',
  in_progress: 'In progress',
  completed: 'Completed',
  declined: 'Declined',
};

function statusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#22c55e';
    case 'in_progress':
      return '#3b82f6';
    case 'planned':
      return '#a855f7';
    case 'under_review':
      return '#f59e0b';
    case 'declined':
      return '#71717a';
    default:
      return '#a1a1aa';
  }
}

function authorLabel(p: SuggestionRow['profiles']): string {
  return p?.display_name || p?.username || 'Unknown';
}

export default function SuggestionsPageClient({ signedIn }: { signedIn: boolean }) {
  const [suggestions, setSuggestions] = useState<SuggestionRow[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [votingFor, setVotingFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(`/api/suggestions${qs}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load.');
      setSuggestions(json.suggestions ?? []);
      setVotedIds(new Set(json.voted_ids ?? []));
      setDemoMode(json.demo_mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(json.errors)
          ? json.errors.map((x: { message: string }) => x.message).join(' ')
          : json.error || 'Failed to submit suggestion.';
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

  async function handleVote(suggestion: SuggestionRow) {
    if (!signedIn || votingFor) return;
    setVotingFor(suggestion.id);
    setError(null);
    const hasVoted = votedIds.has(suggestion.id);
    try {
      const res = await fetch(`/api/suggestions/${suggestion.id}/vote`, {
        method: hasVoted ? 'DELETE' : 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        // 409 = duplicate vote; keep state honest and show the message.
        setError(json.error || 'Voting failed.');
        if (res.status === 409) {
          setVotedIds((prev) => new Set(prev).add(suggestion.id));
        }
        return;
      }
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (hasVoted) next.delete(suggestion.id);
        else next.add(suggestion.id);
        return next;
      });
      setSuggestions((prev) =>
        prev.map((s) =>
          s.id === suggestion.id
            ? { ...s, vote_count: json.vote_count ?? s.vote_count + (hasVoted ? -1 : 1) }
            : s,
        ),
      );
    } catch {
      setError('A network error occurred while voting.');
    } finally {
      setVotingFor(null);
    }
  }

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.5rem' }}>
            Feature Suggestions
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
            Submit ideas and vote on what matters most.
          </p>
        </div>
        {signedIn ? (
          <button type="button" onClick={() => setShowForm((s) => !s)} style={{ padding: '0.625rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
            {showForm ? 'Close' : 'Submit a Suggestion'}
          </button>
        ) : (
          <Link href="/login?next=/suggestions" style={{ padding: '0.625rem 1.25rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
            Sign in to submit &amp; vote
          </Link>
        )}
      </header>

      {demoMode && (
        <p style={{ fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '9999px', background: 'rgba(245,158,11,0.1)', marginBottom: '1rem' }}>
          Demo mode — Supabase not configured
        </p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="s-title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Title</label>
            <input id="s-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Suggest a feature or improvement" maxLength={150} style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none' }} />
          </div>
          <div>
            <label htmlFor="s-body" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>Details</label>
            <textarea id="s-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe the problem this solves and how it should work." rows={4} maxLength={5000} style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          {formError && <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{formError}</p>}
          <div>
            <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.5rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting…' : 'Submit suggestion'}
            </button>
          </div>
        </form>
      )}

      <div role="group" aria-label="Filter suggestions by status" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {STATUS_FILTERS.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s} style={{ padding: '0.375rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, borderRadius: '9999px', cursor: 'pointer', border: '1px solid ' + (status === s ? '#3b82f6' : '#27272a'), background: status === s ? 'rgba(59,130,246,0.15)' : '#111113', color: status === s ? '#93c5fd' : '#a1a1aa' }}>
            {s === 'all' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" style={{ padding: '1rem 1.25rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.75rem', color: '#f87171', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
          {error}{' '}
          <button type="button" onClick={load} style={{ background: 'none', border: 'none', color: '#f87171', textDecoration: 'underline', cursor: 'pointer', font: 'inherit', padding: 0 }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#a1a1aa', textAlign: 'center', padding: '3rem 0' }}>Loading suggestions…</p>
      ) : suggestions.length === 0 ? (
        <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', textAlign: 'center', color: '#a1a1aa' }}>
          {status === 'all' ? 'No suggestions yet. Be the first to suggest a feature!' : 'No suggestions with this status.'}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
          {suggestions.map((s) => {
            const voted = votedIds.has(s.id);
            return (
              <li key={s.id} style={{ padding: '1.25rem 1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleVote(s)}
                  disabled={!signedIn || votingFor === s.id}
                  aria-pressed={voted}
                  aria-label={voted ? `Remove vote from ${s.title}` : `Vote for ${s.title}`}
                  title={signedIn ? (voted ? 'Remove your vote' : 'Vote for this suggestion') : 'Sign in to vote'}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.125rem', minWidth: '3rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', cursor: signedIn ? 'pointer' : 'not-allowed', border: '1px solid ' + (voted ? '#3b82f6' : '#27272a'), background: voted ? 'rgba(59,130,246,0.15)' : '#18181b', color: voted ? '#93c5fd' : '#a1a1aa', opacity: votingFor === s.id ? 0.6 : 1 }}
                >
                  <span aria-hidden="true" style={{ fontSize: '0.875rem', lineHeight: 1 }}>▲</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: voted ? '#93c5fd' : '#fafafa' }}>{s.vote_count}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>{s.title}</h2>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: statusColor(s.status), border: '1px solid ' + statusColor(s.status) + '55', background: statusColor(s.status) + '18', padding: '0.125rem 0.5rem', borderRadius: '9999px' }}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.9375rem', color: '#a1a1aa', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.body}</p>
                  <p style={{ margin: 0, fontSize: '0.8125rem', color: '#71717a' }}>
                    {authorLabel(s.profiles)} · {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
