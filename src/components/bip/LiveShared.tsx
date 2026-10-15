'use client';

const HONESTY_TEXT: Record<string, { label: string; color: string }> = {
  live_activity: { label: 'Live activity received', color: '#22c55e' },
  waiting_first_event: { label: 'Waiting for first real event — seeded project progress', color: '#f59e0b' },
  seeded_progress: { label: 'Seeded project progress', color: '#f59e0b' },
  main_unavailable: { label: 'Main API temporarily unavailable', color: '#ef4444' },
  demo: { label: 'Demo data', color: '#71717a' },
};

export function SourceBadge({ honesty, source }: { honesty: string; source: string }) {
  const h = HONESTY_TEXT[honesty] ?? HONESTY_TEXT.demo;
  return (
    <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem', color: h.color, display: 'inline-block', padding: '0.25rem 0.75rem', border: '1px solid ' + h.color + '55', borderRadius: '9999px', background: h.color + '1A' }}>
      {h.label} · source: {source}
    </p>
  );
}

export interface Board { state: string; at: string | null; ref: string | null }

export function BoardCard({ title, b }: { title: string; b: Board }) {
  const known = b.state !== 'unknown' && !!b.at;
  const color = b.state === 'passed' ? '#22c55e' : b.state === 'failed' ? '#ef4444' : b.state === 'running' ? '#3b82f6' : '#71717a';
  return (
    <div style={{ padding: '0.75rem', background: '#18181b', borderRadius: '0.5rem', flex: '1 1 160px' }}>
      <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '0 0 0.25rem' }}>{title}</p>
      <p style={{ fontSize: '0.9375rem', fontWeight: 700, color, margin: 0 }}>{known ? b.state : 'Unknown'}</p>
      <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0.25rem 0 0' }}>
        {known && b.at ? new Date(b.at).toLocaleString() : 'No verified runs yet'}
        {known && b.ref ? ' · ' + String(b.ref).slice(0, 7) : ''}
      </p>
    </div>
  );
}
