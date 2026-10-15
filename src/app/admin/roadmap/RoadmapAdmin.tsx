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
  is_verified_completed: boolean;
  published_at: string | null;
  created_at: string;
}

const STATUSES = ['planned', 'in_progress', 'completed', 'released', 'on_hold'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'planned',
  priority: 'medium',
  category: '',
  effort_estimate: '',
  target_quarter: '',
};

export default function RoadmapAdmin() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
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
      const res = await fetch('/api/admin/roadmap');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load.');
      setItems(json.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmap items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(item: RoadmapItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      status: item.status,
      priority: item.priority,
      category: item.category,
      effort_estimate: item.effort_estimate ?? '',
      target_quarter: item.target_quarter ?? '',
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
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        category: form.category,
        effort_estimate: form.effort_estimate || null,
        target_quarter: form.target_quarter || null,
      };
      const res = await fetch(editingId ? `/api/admin/roadmap/${editingId}` : '/api/admin/roadmap', {
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

  async function handleDelete(item: RoadmapItem) {
    if (!window.confirm(`Delete "${item.title}"? This also removes its milestones.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/roadmap/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete.');
        return;
      }
      if (editingId === item.id) resetForm();
      load();
    } catch {
      setError('A network error occurred.');
    }
  }

  async function togglePublished(item: RoadmapItem) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/roadmap/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          category: item.category,
          effort_estimate: item.effort_estimate,
          target_quarter: item.target_quarter,
          published: !item.published_at,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to update publish state.');
        return;
      }
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

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ padding: '1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '0.875rem', marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fafafa', margin: 0 }}>
          {editingId ? 'Edit roadmap item' : 'New roadmap item'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          <div>
            <label htmlFor="rm-title" style={labelStyle}>Title *</label>
            <input id="rm-title" required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="rm-category" style={labelStyle}>Category *</label>
            <input id="rm-category" required maxLength={80} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="rm-status" style={labelStyle}>Status *</label>
            <select id="rm-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rm-priority" style={labelStyle}>Priority *</label>
            <select id="rm-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} style={inputStyle}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="rm-effort" style={labelStyle}>Effort estimate</label>
            <input id="rm-effort" maxLength={50} value={form.effort_estimate} onChange={(e) => setForm({ ...form, effort_estimate: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="rm-quarter" style={labelStyle}>Target quarter</label>
            <input id="rm-quarter" maxLength={30} value={form.target_quarter} onChange={(e) => setForm({ ...form, target_quarter: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="rm-desc" style={labelStyle}>Description *</label>
          <textarea id="rm-desc" required maxLength={5000} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        {formError && <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{formError}</p>}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create item'}
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
      ) : items.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No roadmap items yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {items.map((item) => (
            <li key={item.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#fafafa' }}>{item.title}</p>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#a1a1aa', lineHeight: 1.5 }}>{item.description}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                    {item.status} · {item.priority} · {item.category}
                    {' · '}{item.published_at ? 'published' : 'draft'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => startEdit(item)} style={{ padding: '0.375rem 0.75rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button type="button" onClick={() => togglePublished(item)} style={{ padding: '0.375rem 0.75rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: item.published_at ? '#f59e0b' : '#22c55e', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    {item.published_at ? 'Unpublish' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => handleDelete(item)} style={{ padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '0.375rem', color: '#f87171', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
