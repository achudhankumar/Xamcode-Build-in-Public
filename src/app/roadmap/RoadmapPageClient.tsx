'use client';

import { useCallback, useEffect, useState } from 'react';
import { OfficialRoadmap } from '@/components/bip/LiveLists';

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
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch('/api/roadmap?' + params.toString());
      if (!res.ok) throw new Error('Request failed');
      const data: ApiResponse = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items ?? []);
      setDemoMode(data.demo_mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap items.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fafafa', margin: '0 0 0.75rem' }}>
          Roadmap
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#a1a1aa', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
          What we are building next, and what is already done.
        </p>
        {demoMode && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: '#f59e0b', display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '9999px', background: 'rgba(245, 158, 11, 0.1)' }}>
            Sample content — Supabase not configured
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
      <OfficialRoadmap />

      {loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          Loading roadmap...
        </div>
      )}

      {!loading && error && (
        <div style={{ padding: '1.5rem', textAlign: 'center', color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.75rem' }}>
          <p style={{ margin: '0 0 1rem', fontWeight: 600 }}>Could not load the roadmap.</p>
          <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{error}</p>
          <button type="button" onClick={loadItems} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#a1a1aa', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
          No roadmap items match your filters.
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {items.map((item) => (
            <div key={item.id} style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>{item.title}</h2>
                <span style={{ flexShrink: 0, fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: STATUS_COLORS[item.status] ?? '#a1a1aa', padding: '0.125rem 0.5rem', border: '1px solid ' + (STATUS_COLORS[item.status] ?? '#27272a'), borderRadius: '9999px' }}>
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#a1a1aa', margin: 0, lineHeight: 1.6 }}>{item.description}</p>
              <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: '#71717a' }}>
                <span style={{ padding: '0.125rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem' }}>{item.category}</span>
                <span style={{ padding: '0.125rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem' }}>{PRIORITY_LABELS[item.priority] ?? item.priority} priority</span>
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
