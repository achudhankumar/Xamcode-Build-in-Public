'use client';

import { useCallback, useEffect, useState } from 'react';
import { LivePanels } from '@/components/bip/LivePanels';

interface ProgressMilestone {
  id: string;
  roadmap_item_id: string;
  roadmap_title: string | null;
  milestone_type: string;
  title: string;
  description: string | null;
  status: string;
  weight: number;
}

interface ProgressResponse {
  milestones: ProgressMilestone[];
  total_weight: number;
  completed_weight: number;
  progress_percent: number | null;
  completion_count: number;
  in_progress_count: number;
  planned_count: number;
  total_count: number;
  demo_mode: boolean;
  error?: string;
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  verified: 'Verified',
};

const STATUS_COLORS: Record<string, string> = {
  planned: '#71717a',
  in_progress: '#3b82f6',
  completed: '#f59e0b',
  verified: '#22c55e',
};

export default function ProgressPageClient() {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/progress');
      if (!res.ok) throw new Error('Request failed');
      const json: ProgressResponse = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress data.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          Live Development Progress
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
          Track verified development progress across all categories.
        </p>
        {data?.demo_mode && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)' }}>
            Sample content — Supabase not configured
          </p>
        )}
      </header>

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          Loading progress...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Could not load progress data.</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{error}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 1.25rem' }}>Development Progress</h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fafafa', display: 'block', marginBottom: '0.5rem' }}>
                  {data.progress_percent === null ? '—' : data.progress_percent + '%'}
                </span>
                <div style={{ height: '8px', background: '#18181b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (data.progress_percent ?? 0) + '%', background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
                {data.progress_percent === null && (
                  <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0.5rem 0 0' }}>No milestones recorded yet.</p>
                )}
                <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0.5rem 0 0' }}>
                  Verified weight: {data.completed_weight} / {data.total_weight}
                </p>
              </div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{data.completion_count}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Completed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{data.in_progress_count}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>In Progress</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#71717a' }}>{data.planned_count}</span>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Planned</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 1rem' }}>Milestones</h2>
            {data.milestones.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#a1a1aa' }}>No milestones recorded yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {data.milestones.map((m) => (
                  <div key={m.id} style={{ padding: '1rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 240px' }}>
                        <p style={{ fontWeight: 600, color: '#fafafa', margin: '0 0 0.25rem' }}>{m.title}</p>
                        {m.roadmap_title && (
                          <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 0.25rem' }}>{m.roadmap_title}</p>
                        )}
                        {m.description && (
                          <p style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>{m.description}</p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLORS[m.status] ?? '#a1a1aa', padding: '0.125rem 0.5rem', border: '1px solid ' + (STATUS_COLORS[m.status] ?? '#27272a'), borderRadius: '9999px' }}>
                          {STATUS_LABELS[m.status] ?? m.status}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: '#71717a', padding: '0.125rem 0.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.375rem' }}>
                          w{m.weight}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <LivePanels />
    </div>
  );
}
