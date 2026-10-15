'use client';

import { useEffect, useState } from 'react';

export function OfficialRoadmap() {
  const [data, setData] = useState<{ source: string; roadmap: { id: string; title: string; summary?: string; description?: string; status: string }[] } | null>(null);
  useEffect(() => {
    let c = false;
    fetch('/api/live/summary').then((r) => r.json()).then((j) => { if (!c) setData(j); }).catch(() => {});
    return () => { c = true; };
  }, []);
  const items = data?.roadmap ?? [];
  if (!data || data.source === 'unavailable' || items.length === 0) return null;
  return (
    <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.25rem' }}>Official Xamcode milestones</h2>
      <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: '0 0 1rem' }}>Source of truth: main Xamcode app. Community suggestions remain separate below.</p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {items.map((it) => (
          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#fafafa', margin: 0 }}>{it.title}</p>
              {(it.summary || it.description) && <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: '0.25rem 0 0' }}>{it.summary ?? it.description}</p>}
            </div>
            <span style={{ fontSize: '0.6875rem', color: '#a1a1aa', textTransform: 'uppercase', flexShrink: 0 }}>{it.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceEvents() {
  const [items, setItems] = useState<{ id: string; type: string; summary: string; ref: string; at: string }[]>([]);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let c = false;
    fetch('/api/live/activity?limit=20').then((r) => r.json()).then((j) => { if (!c) { setItems(j.activity ?? []); setOk(j.source === 'main'); } }).catch(() => {});
    return () => { c = true; };
  }, []);
  if (!ok) return null;
  return (
    <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 0.25rem' }}>Source commits &amp; deployments (read-only)</h2>
      <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: '0 0 1rem' }}>From the main Xamcode app. Never auto-inserted into release notes.</p>
      {items.length === 0 ? (
        <p style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: 0 }}>No source events received yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {items.slice(0, 20).map((e) => (
            <div key={e.id} style={{ padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#fafafa', margin: '0 0 0.25rem' }}>{e.summary}</p>
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{e.type}{e.at ? ' · ' + new Date(e.at).toLocaleString() : ''}{e.ref ? ' · ' + String(e.ref).slice(0, 7) : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReadinessBadgeInner() {
  const [data, setData] = useState<{ source: string; liveActivity: boolean; progress: { percent: number }; launch: { readiness: string } } | null>(null);
  useEffect(() => {
    let c = false;
    fetch('/api/live/summary').then((r) => r.json()).then((j) => { if (!c) setData(j); }).catch(() => {});
    return () => { c = true; };
  }, []);
  if (!data || data.source === 'unavailable') return null;
  return (
    <div style={{ marginTop: '1.5rem', display: 'inline-block', padding: '0.375rem 0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9999px', fontSize: '0.8125rem', color: '#22c55e' }}>
      {data.progress.percent}% verified · {data.launch.readiness}{data.liveActivity ? ' · live' : ' · awaiting live events'}
    </div>
  );
}
