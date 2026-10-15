'use client';

import { useCallback, useEffect, useState } from 'react';

interface Milestone {
  id: string;
  roadmap_item_id: string;
  milestone_type: string;
  title: string;
  description: string | null;
  status: string;
  weight: number;
  verified_at: string | null;
  created_at: string;
  roadmap_items: { title: string } | null;
}

interface RoadmapOption {
  id: string;
  title: string;
}

const TYPES = ['feature', 'improvement', 'fix', 'verification', 'release'];
const STATUSES = ['planned', 'in_progress', 'completed', 'verified'];

const EMPTY_FORM = {
  roadmap_item_id: '',
  milestone_type: 'feature',
  title: '',
  description: '',
  status: 'planned',
  weight: '1',
};

export default function MilestonesAdmin() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [roadmapOptions, setRoadmapOptions] = useState<RoadmapOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [msRes, rmRes] = await Promise.all([
        fetch('/api/admin/milestones'),
        fetch('/api/admin/roadmap'),
      ]);
      const msJson = await msRes.json();
      const rmJson = await rmRes.json();
      if (!msRes.ok) throw new Error(msJson.error || 'Failed to load milestones.');
      setMilestones(msJson.milestones ?? []);
      if (rmRes.ok) {
        setRoadmapOptions((rmJson.items ?? []).map((i: { id: string; title: string }) => ({ id: i.id, title: i.title })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load milestones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(m: Milestone) {
    setEditingId(m.id);
    setForm({
      roadmap_item_id: m.roadmap_item_id,
      milestone_type: m.milestone_type,
      title: m.title,
      description: m.description ?? '',
      status: m.status,
      weight: String(m.weight),
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        roadmap_item_id: form.roadmap_item_id,
        milestone_type: form.milestone_type,
        title: form.title,
        description: form.description || null,
        status: form.status,
        weight: Number(form.weight),
      };
      const res = await fetch(editingId ? `/api/admin/milestones/${editingId}` : '/api/admin/milestones', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(
          Array.isArray(json.errors)
            ? json.errors.map((x: { message: string }) => x.message).join(' ')
            : json.error || 'Failed to save.',
        );
        return;
      }
      resetForm();
      load();
    } catch {
      setFormError('A network error occurred.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Milestone) {
    if (!window.confirm(`Delete milestone "${m.title}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/milestones/${m.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete.');
        return;
      }
      if (editingId === m.id) resetForm();
      load();
    } catch {
      setError('A network error occurred.');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '0.5rem',
    color: '#fafafa',
    outline: 'none',
    font: 'inherit',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#fafafa',
    marginBottom: '0.25rem',
  };

  async function markVerified(m: Milestone) {
    if (!window.confirm(`Mark "${m.title}" as verified? This stamps it with your admin identity.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/milestones/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadmap_item_id: m.roadmap_item_id,
          milestone_type: m.milestone_type,
          title: m.title,
          description: m.description,
          status: 'verified',
          weight: m.weight,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(
          Array.isArray(json.errors)
            ? json.errors.map((x: { message: string }) => x.message).join(' ')
            : json.error || 'Failed to verify.',
        );
        return;
      }
      load();
    } catch {
      setError('A network error occurred.');
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ padding: '1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '0.875rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
          {editingId ? 'Edit milestone' : 'Record milestone'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          <div>
            <label htmlFor="ms-roadmap" style={labelStyle}>Roadmap item *</label>
            <select id="ms-roadmap" required value={form.roadmap_item_id} onChange={(e) => setForm({ ...form, roadmap_item_id: e.target.value })} style={inputStyle}>
              <option value="">Select…</option>
              {roadmapOptions.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ms-type" style={labelStyle}>Type *</label>
            <select id="ms-type" value={form.milestone_type} onChange={(e) => setForm({ ...form, milestone_type: e.target.value })} style={inputStyle}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ms-status" style={labelStyle}>Status *</label>
            <select id="ms-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="ms-weight" style={labelStyle}>Weight (0–100) *</label>
            <input id="ms-weight" type="number" min={0.1} max={100} step="0.1" required value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="ms-title" style={labelStyle}>Title *</label>
          <input id="ms-title" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        </div>
        <div>
          <label htmlFor="ms-desc" style={labelStyle}>Description</label>
          <textarea id="ms-desc" rows={2} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        {formError && <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{formError}</p>}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Record milestone'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{ padding: '0.5rem 1.25rem', background: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <div role="alert" style={{ padding: '0.875rem 1.125rem', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '0.5rem', color: '#f87171', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#a1a1aa' }}>Loading…</p>
      ) : milestones.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No milestones recorded yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {milestones.map((m) => (
            <li key={m.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#fafafa' }}>{m.title}</p>
                {m.description && <p style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', color: '#a1a1aa' }}>{m.description}</p>}
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                  {roadmapOptions.find((o) => o.id === m.roadmap_item_id)?.title ?? 'Unknown item'}
                  {' · '}{m.milestone_type} · weight {m.weight} · {m.status}
                  {m.verified_at && ` · verified ${new Date(m.verified_at).toLocaleDateString()}`}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {m.status !== 'verified' && (
                  <button type="button" onClick={() => markVerified(m)} style={{ padding: '0.375rem 0.75rem', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '0.375rem', color: '#22c55e', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Verify
                  </button>
                )}
                <button type="button" onClick={() => startEdit(m)} style={{ padding: '0.375rem 0.75rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(m)} style={{ padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '0.375rem', color: '#f87171', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
