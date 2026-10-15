'use client';

import { useCallback, useEffect, useState } from 'react';
import { SourceEvents } from '@/components/bip/LiveLists';

interface ChangelogEntry {
  version: string;
  summary: string;
  body: string | null;
  features: string[] | null;
  improvements: string[] | null;
  fixes: string[] | null;
  limitations: string[] | null;
  published_at: string | null;
}

interface ChangelogResponse {
  entries: ChangelogEntry[];
  demo_mode: boolean;
  error?: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function EntryList({ title, items, color }: { title: string; items: string[]; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color, margin: '0 0 0.375rem' }}>
        {title}
      </p>
      <ul style={{ margin: 0, paddingLeft: '1.125rem' }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: '0.9375rem', color: '#a1a1aa', lineHeight: 1.6 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogPageClient() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/changelog');
      if (!res.ok) throw new Error('Request failed');
      const json: ChangelogResponse = await res.json();
      if (json.error) throw new Error(json.error);
      setEntries(json.entries ?? []);
      setDemoMode(json.demo_mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load changelog entries.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          Changelog
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>
          Every release and major update is documented.
        </p>
        {demoMode && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)' }}>
            Sample content — Supabase not configured
          </p>
        )}
      </header>

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          Loading changelog...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Could not load the changelog.</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{error}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          No changelog entries yet.
        </div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {entries.map((entry) => (
            <article key={entry.version} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>v{entry.version}</h2>
                <span style={{ fontSize: '0.8125rem', color: '#71717a' }}>{formatDate(entry.published_at)}</span>
              </div>
              <p style={{ fontSize: '1rem', color: '#fafafa', margin: '0 0 0.75rem', fontWeight: 500 }}>{entry.summary}</p>
              {entry.body && (
                <p style={{ fontSize: '0.9375rem', color: '#a1a1aa', margin: '0 0 1rem', lineHeight: 1.6 }}>{entry.body}</p>
              )}
              <EntryList title="Features" items={entry.features ?? []} color="#22c55e" />
              <EntryList title="Improvements" items={entry.improvements ?? []} color="#3b82f6" />
              <EntryList title="Fixes" items={entry.fixes ?? []} color="#8b5cf6" />
              <EntryList title="Limitations" items={entry.limitations ?? []} color="#f59e0b" />
            </article>
          ))}
        </div>
      )}
      <SourceEvents />
    </div>
  );
}
