'use client';

import { useCallback, useEffect, useState } from 'react';

interface Entry {
  id: string;
  version: string;
  summary: string;
  body: string | null;
  features: string[] | null;
  improvements: string[] | null;
  fixes: string[] | null;
  limitations: string[] | null;
  published_at: string;
}

const EMPTY_FORM = {
  version: '',
  summary: '',
  body: '',
  features: '',
  improvements: '',
  fixes: '',
  limitations: '',
};

function toList(value: string): string[] | null {
  const items = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

export default function ChangelogAdmin() {
  const [entries, setEntries] = useState<Entry[]>([]);
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
      const res = await fetch('/api/admin/changelog');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load.');
      setEntries(json.entries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load changelog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEdit(e: Entry) {
    setEditingId(e.id);
    setForm({
      version: e.version,
      summary: e.summary,
      body: e.body ?? '',
      features: (e.features ?? []).join('\n'),
      improvements: (e.improvements ?? []).join('\n'),
      fixes: (e.fixes ?? []).join('\n'),
      limitations: (e.limitations ?? []).join('\n'),
    });
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setFormError(null);
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      const payload = {
        version: form.version,
        summary: form.summary,
        body: form.body || null,
        features: toList(form.features),
        improvements: toList(form.improvements),
        fixes: toList(form.fixes),
        limitations: toList(form.limitations),
      };
      const res = await fetch(editingId ? `/api/admin/changelog/${editingId}` : '/api/admin/changelog', {
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

  async function handleDelete(entry: Entry) {
    if (!window.confirm(`Delete changelog entry ${entry.version}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/changelog/${entry.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || 'Failed to delete.');
        return;
      }
      if (editingId === entry.id) resetForm();
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
          {editingId ? `Edit ${form.version}` : 'Publish changelog entry'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          <div>
            <label htmlFor="cl-version" style={labelStyle}>Version * (e.g. 1.2.0)</label>
            <input id="cl-version" required maxLength={30} value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="cl-summary" style={labelStyle}>Summary *</label>
            <input id="cl-summary" required maxLength={300} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} style={inputStyle} />
          </div>
        </div>
        <div>
          <label htmlFor="cl-body" style={labelStyle}>Body</label>
          <textarea id="cl-body" rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.875rem' }}>
          {(['features', 'improvements', 'fixes', 'limitations'] as const).map((key) => (
            <div key={key}>
              <label htmlFor={`cl-${key}`} style={labelStyle}>{key} (one per line)</label>
              <textarea id={`cl-${key}`} rows={3} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={{ ...inputStyle, resize: 'vertical', fontSize: '0.8125rem' }} />
            </div>
          ))}
        </div>
        {formError && <p role="alert" style={{ margin: 0, fontSize: '0.875rem', color: '#f87171' }}>{formError}</p>}
        <div style={{ display: 'flex', gap: '0.625rem' }}>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.25rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish entry'}
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
      ) : entries.length === 0 ? (
        <p style={{ color: '#a1a1aa' }}>No changelog entries yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.75rem' }}>
          {entries.map((entry) => (
            <li key={entry.id} style={{ padding: '1rem 1.25rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#fafafa' }}>{entry.version} — {entry.summary}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#71717a' }}>
                  Published {new Date(entry.published_at).toLocaleDateString()}
                  {entry.features ? ` · ${entry.features.length} features` : ''}
                  {entry.fixes ? ` · ${entry.fixes.length} fixes` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => startEdit(entry)} style={{ padding: '0.375rem 0.75rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.375rem', color: '#fafafa', fontSize: '0.8125rem', cursor: 'pointer' }}>
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(entry)} style={{ padding: '0.375rem 0.75rem', background: 'transparent', border: '1px solid rgba(248,113,113,0.4)', borderRadius: '0.375rem', color: '#f87171', fontSize: '0.8125rem', cursor: 'pointer' }}>
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
