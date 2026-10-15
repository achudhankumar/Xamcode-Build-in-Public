'use client';

import { useCallback, useEffect, useState } from 'react';
import { LivePanels } from '@/components/bip/LivePanels';

interface LiveSummary {
  source: string;
  honesty: string;
  reachable: boolean;
  liveActivity: boolean;
  progress: {
    percent: number;
    verifiedWeight: number;
    totalWeight: number;
    phase: string;
    counts: {
      verified: number;
      inProgress: number;
      needsReview: number;
      planned: number;
      total: number;
    };
  };
  milestones: Array<{
    id: string;
    title: string;
    weight: number;
    status: string;
    criteria: string | null;
    evidence: string | null;
    verifiedAt: string | null;
  }>;
  roadmap: Array<{ id: string; title: string; summary?: string; description?: string; status: string; updatedAt?: string }>;
  recentActivity: Array<{ id: string; type: string; summary: string; detail: string; ref: string; status: string; source: string; at: string }>;
  launch: {
    readinessPercent: number;
    readiness: string;
    estimated: string | null;
    confirmed: string | null;
    note: string;
    countdownMs: number | null;
    estimatedCountdownMs: number | null;
    hasConfirmedDate: boolean;
  };
  status: {
    build: { state: string; at: string | null; ref: string | null };
    tests: { state: string; at: string | null; ref: string | null };
    deploy: { state: string; at: string | null; ref: string | null };
  };
  integration: { webhooks: boolean; ciIngest: boolean; live: boolean };
  counts?: { waitlist: number; ideas: number; chatMessages: number; openReports: number };
  error?: string;
}

interface LiveProgress {
  percent: number | null;
  completionCount: number;
  inProgressCount: number;
  plannedCount: number;
  totalCount: number;
  milestones: Array<{ id: string; title: string; status: string; weight: number }>;
  source: string;
  honesty: string;
  error?: string;
}

function toLiveProgress(s: LiveSummary | null | undefined): LiveProgress {
  if (!s || s.source === 'unavailable') {
    return {
      percent: null,
      completionCount: 0,
      inProgressCount: 0,
      plannedCount: 0,
      totalCount: 0,
      milestones: [],
      source: 'unavailable',
      honesty: 'main_unavailable',
      error: s?.error ?? 'Main API temporarily unavailable',
    };
  }
  const counts = s.progress?.counts ?? { verified: 0, inProgress: 0, needsReview: 0, planned: 0, total: 0 };
  const milestones = (s.milestones ?? []).map((m) => ({ id: m.id, title: m.title, status: m.status, weight: m.weight }));
  return {
    percent: s.progress ? s.progress.percent : null,
    completionCount: counts.verified + counts.needsReview,
    inProgressCount: counts.inProgress,
    plannedCount: counts.planned,
    totalCount: counts.total,
    milestones,
    source: s.source,
    honesty: s.honesty,
    error: s.error,
  };
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  verified: 'Verified',
  passed: 'Passed',
  failed: 'Failed',
  running: 'Running',
  unknown: 'Unknown',
};

const STATUS_COLORS: Record<string, string> = {
  planned: '#71717a',
  in_progress: '#3b82f6',
  completed: '#f59e0b',
  verified: '#22c55e',
  passed: '#22c55e',
  failed: '#ef4444',
  running: '#3b82f6',
  unknown: '#71717a',
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}


export default function ProgressPageClient() {
  const [data, setData] = useState<LiveProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/live/summary');
      if (!res.ok) throw new Error('Request failed');
      const json: LiveSummary = await res.json();
      if (!json || typeof json !== 'object' || typeof json.source !== 'string') {
        throw new Error('Malformed summary response');
      }
      // Demo/unavailable payloads are valid classifications: they render via
      // the honest header badges below instead of the error box.
      setData(toLiveProgress(json));
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
        {data?.source === 'demo' && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)' }}>
            Demo content — live API not configured
          </p>
        )}
        {data?.source === 'unavailable' && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#ef4444', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)' }}>
            Main API unavailable
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

      {!loading && !error && data && data.source === 'unavailable' && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Live progress is temporarily unavailable.</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{data.error ?? 'The main Xamcode API did not respond.'}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && data && data.source !== 'unavailable' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', background: '#18181b', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{data.percent ?? 0}%</span>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>verified</span>
            </div>
            <div style={{ padding: '1rem', background: '#18181b', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{data.completionCount}</span>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>completed</span>
            </div>
            <div style={{ padding: '1rem', background: '#18181b', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>{data.inProgressCount}</span>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>in progress</span>
            </div>
            <div style={{ padding: '1rem', background: '#18181b', borderRadius: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#71717a' }}>{data.plannedCount}</span>
              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>planned</span>
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
                        <span style={{ fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', color: STATUS_COLORS[m.status] ?? '#a1a1aa', padding: '0.125rem 0.5rem', border: '1px solid ' + (STATUS_COLORS[m.status] ?? '#27272a'), borderRadius: '9999px' }}>
                          {getStatusLabel(m.status)}
                        </span>
                      </div>
                      <div style={{ flexShrink: 0 }}>
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
      {data?.source !== 'unavailable' && <LivePanels />}
    </div>
  );
}
