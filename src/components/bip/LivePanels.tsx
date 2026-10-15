'use client';

import { useEffect, useState } from 'react';
import { BoardCard, SourceBadge } from './LiveShared';

interface Summary {
  source: string;
  honesty: string;
  liveActivity: boolean;
  progress: { percent: number; verifiedWeight: number; totalWeight: number; phase: string };
  launch: { readiness: string; estimated: string | null; confirmed: string | null; hasConfirmedDate: boolean };
  status: { build: { state: string; at: string | null; ref: string | null }; tests: { state: string; at: string | null; ref: string | null }; deploy: { state: string; at: string | null; ref: string | null } };
  recentActivity: { id: string; type: string; summary: string; ref: string; source: string; at: string }[];
}

export function LivePanels() {
  const [data, setData] = useState<Summary | null>(null);
  useEffect(() => {
    let c = false;
    fetch('/api/live/summary').then((r) => r.json()).then((j) => { if (!c) setData(j); }).catch(() => {});
    return () => { c = true; };
  }, []);
  if (!data) return null;
  const evts = data.recentActivity ?? [];
  return (
    <div style={{ display: 'grid', gap: '1.25rem', marginTop: '1.5rem' }}>
      <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
        <SourceBadge honesty={data.honesty} source={data.source} />
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <BoardCard title="Build" b={data.status.build} />
          <BoardCard title="Tests" b={data.status.tests} />
          <BoardCard title="Deploy" b={data.status.deploy} />
        </div>
        <p style={{ fontSize: '0.8125rem', color: '#a1a1aa', margin: '1rem 0 0' }}>
          Verified progress {data.progress.percent}% ({data.progress.verifiedWeight}/{data.progress.totalWeight} weight) · Phase {data.progress.phase} · Readiness {data.launch.readiness}
          {data.launch.hasConfirmedDate && data.launch.confirmed ? ' · Confirmed ' + new Date(data.launch.confirmed).toLocaleDateString() : data.launch.estimated ? ' · Estimated ' + new Date(data.launch.estimated).toLocaleDateString() : ' · No confirmed launch date'}
        </p>
      </div>
      <div style={{ padding: '1.5rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fafafa', margin: '0 0 1rem' }}>Recent development activity</h2>
        {evts.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: 0 }}>Waiting for first real event — no verified development events received yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {evts.slice(0, 10).map((e) => (
              <div key={e.id} style={{ padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#fafafa', margin: '0 0 0.25rem' }}>{e.summary}</p>
                <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{e.type} · {e.source}{e.at ? ' · ' + new Date(e.at).toLocaleString() : ''}{e.ref ? ' · ' + String(e.ref).slice(0, 7) : ''}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
