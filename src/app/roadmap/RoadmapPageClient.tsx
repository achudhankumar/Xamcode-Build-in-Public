'use client';

import { useCallback, useEffect, useState } from 'react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  effort_estimate: string | null;
  target_quarter: string | null;
  verification_notes: string | null;
  is_verified_completed: boolean;
  created_at: string;
  published_at: string | null;
}

interface ApiResponse {
  items: RoadmapItem[];
  demo_mode: boolean;
  error?: string;
}

interface LiveRoadmapItem {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  status: string;
  updatedAt?: string;
}

interface LiveSummaryResponse {
  source: string;
  roadmap?: LiveRoadmapItem[];
}

type DisplayRoadmapItem = {
  id: string;
  title: string;
  description?: string | null;
  summary?: string;
  status: string;
  category?: string;
  priority?: string;
  target_quarter?: string | null;
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'released', label: 'Released' },
  { value: 'on_hold', label: 'On Hold' },
];

const STATUS_LABELS: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  released: 'Released',
  on_hold: 'On Hold',
};

const STATUS_COLORS: Record<string, string> = {
  planned: '#71717a',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  released: '#8b5cf6',
  on_hold: '#f59e0b',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function RoadmapPageClient() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [liveItems, setLiveItems] = useState<LiveRoadmapItem[]>([]);
  const [liveSource, setLiveSource] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Main API roadmap is the source of truth. Supabase items are only a
  // fallback when the main API returned no roadmap, and never demo seeds.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, rRes] = await Promise.all([fetch('/api/live/summary'), fetch('/api/roadmap?page_size=100')]);
      if (!sRes.ok && !rRes.ok) throw new Error('Request failed');
      const sJson: LiveSummaryResponse | null = sRes.ok ? ((await sRes.json()) as LiveSummaryResponse) : null;
      const rJson: ApiResponse | null = rRes.ok ? ((await rRes.json()) as ApiResponse) : null;
      if (rJson?.error && !sJson) throw new Error(rJson.error);
      const source = sJson && typeof sJson.source === 'string' ? sJson.source : null;
      const roadmap = sJson && Array.isArray(sJson.roadmap) ? sJson.roadmap : [];
      setLiveSource(source);
      setLiveItems(source === 'main' ? roadmap : []);
      // Never render seeded sample items as real roadmap content.
      setItems(rJson && !rJson.error && !rJson.demo_mode ? (rJson.items ?? []) : []);
      setDemoMode(rJson?.demo_mode === true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap items.');
      setItems([]);
      setLiveItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const usingLive = liveItems.length > 0;
  const displayItems: DisplayRoadmapItem[] = usingLive ? liveItems : items;
  const query = search.trim().toLowerCase();
  const filtered = displayItems.filter((item) => {
    const statusOk = !status || status === 'all' || item.status === status;
    const haystack = (item.title + ' ' + (item.description ?? '') + ' ' + (item.summary ?? '')).toLowerCase();
    return statusOk && (!query || haystack.includes(query));
  });

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          Roadmap
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
          What we are building next, and what is already done.
        </p>
        {demoMode && !usingLive && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)' }}>
            Sample roadmap hidden — Supabase not configured
          </p>
        )}
        {liveSource === 'unavailable' && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#ef4444', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.1)' }}>
            Main API unavailable
          </p>
        )}
      </header>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roadmap..."
          aria-label="Search roadmap"
          style={{ flex: '1 1 240px', minWidth: '200px', padding: '0.625rem 0.875rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {STATUS_FILTERS.map((filter) => {
            const isActive = status === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                style={{ padding: '0.5rem 0.875rem', background: isActive ? '#3b82f6' : 'transparent', color: isActive ? '#ffffff' : '#a1a1aa', border: '1px solid ' + (isActive ? '#3b82f6' : '#27272a'), borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease' }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {usingLive && !loading && !error && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.25rem' }}>Official Xamcode milestones</h2>
          <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: 0 }}>Source of truth: main Xamcode app.</p>
        </div>
      )}

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          Loading roadmap...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Could not load the roadmap.</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{error}</p>
          <button type="button" onClick={load} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          {displayItems.length === 0 ? 'No roadmap items published yet.' : 'No roadmap items match your filters.'}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((item) => (
            <div key={item.id} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>{item.title}</h2>
                <span style={{ flexShrink: 0, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: STATUS_COLORS[item.status] ?? '#a1a1aa', padding: '0.125rem 0.5rem', border: '1px solid ' + (STATUS_COLORS[item.status] ?? '#27272a'), borderRadius: '9999px' }}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              {(item.description || item.summary) && (
                <p style={{ fontSize: '0.9375rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>{item.description || item.summary}</p>
              )}
              <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#71717a' }}>
                {item.category && (
                  <span style={{ padding: '0.125rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem' }}>{item.category}</span>
                )}
                {item.priority && (
                  <span style={{ padding: '0.125rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem' }}>{PRIORITY_LABELS[item.priority] ?? item.priority} priority</span>
                )}
                {item.target_quarter && (
                  <span style={{ padding: '0.125rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem' }}>{item.target_quarter}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
