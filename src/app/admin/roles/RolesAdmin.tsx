'use client';

import { useCallback, useEffect, useState } from 'react';

interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  role: string;
  created_at: string;
}

const ROLES = ['member', 'moderator', 'admin'];

export default function RolesAdmin({ myUserId }: { myUserId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load users.');
      setProfiles(json.profiles ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(p: Profile, role: string) {
    if (!window.confirm(`Change ${p.username || p.display_name || p.id} to "${role}"?`)) return;
    setBusyId(p.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: p.id, role }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to update role.');
        return;
      }
      setProfiles((prev) => prev.map((x) => (x.id === p.id ? { ...x, role } : x)));
    } catch {
      setError('A network error occurred.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <p style={{ fontSize: '0.8125rem', color: '#71717a', margin: '0 0 1rem' }}>
        Roles decide what each signed-in user can do. The first admin must be promoted manually
        (see docs/SETUP.md); after that, admins can promote others here.
      </p>

      {error && (
        <div role="alert" style={{ padding: '0.875rem 1.125rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Loading…</p>
      ) : profiles.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No users found.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.625rem' }}>
          {profiles.map((p) => {
            const isSelf = p.id === myUserId;
            return (
              <li key={p.id} style={{ padding: '0.875rem 1.125rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.625rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, color: '#fafafa', fontSize: '0.9375rem' }}>
                    {p.display_name || p.username || 'Unnamed user'}
                    {isSelf && <span style={{ marginLeft: '0.5rem', fontSize: '0.6875rem', color: '#71717a', border: '1px solid #27272a', borderRadius: '9999px', padding: '0.0625rem 0.5rem' }}>you</span>}
                  </p>
                  <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#71717a' }}>
                    Joined {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isSelf ? (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#93c5fd' }}>{p.role}</span>
                ) : (
                  <select
                    aria-label={`Role for ${p.username || p.display_name || p.id}`}
                    value={p.role}
                    disabled={busyId === p.id}
                    onChange={(e) => setRole(p, e.target.value)}
                    style={{ padding: '0.375rem 0.625rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem' }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
