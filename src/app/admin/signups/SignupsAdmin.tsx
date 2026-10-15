'use client';

import { useCallback, useEffect, useState } from 'react';

interface Signup {
  id: string;
  email: string;
  display_name: string | null;
  interest: string | null;
  status: string;
  created_at: string;
}

const STATUSES = ['pending', 'confirmed', 'unsubscribed', 'bounced'];

export default function SignupsAdmin() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/signups');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load signups.');
      setSignups(json.signups ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load signups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(s: Signup, status: string) {
    setBusyId(s.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/signups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, status }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to update signup.');
        return;
      }
      setSignups((prev) => prev.map((x) => (x.id === s.id ? { ...x, status } : x)));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0 0 1rem' }}>
        Private waitlist data — visible to admins only. Do not share outside the team.
      </p>

      {error && (
        <div role="alert" style={{ padding: '0.875rem 1.125rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Loading…</p>
      ) : signups.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No signups yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#71717a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Email</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Interest</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Signed up</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id} style={{ borderTop: '1px solid #27272a', color: '#a1a1aa' }}>
                  <td style={{ padding: '0.625rem 0.75rem', color: '#fafafa' }}>{s.email}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>{s.display_name || '—'}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>{s.interest || '—'}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '0.625rem 0.75rem' }}>
                    <select
                      aria-label={`Status for ${s.email}`}
                      value={s.status}
                      disabled={busyId === s.id}
                      onChange={(e) => setStatus(s, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem' }}
                    >
                      {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
