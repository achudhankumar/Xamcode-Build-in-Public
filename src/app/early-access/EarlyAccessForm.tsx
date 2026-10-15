'use client';

import { useState } from 'react';

const INTEREST_OPTIONS = [
  { value: 'general', label: 'General interest' },
  { value: 'features', label: 'Features & roadmap' },
  { value: 'testing', label: 'Testing & feedback' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'other', label: 'Other' },
];

interface FieldErrors {
  email?: string;
  display_name?: string;
  interest?: string;
  opted_in?: string;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; email: string }
  | { kind: 'error'; message: string; fieldErrors?: FieldErrors };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(input: { email: string; display_name: string; interest: string; opted_in: boolean }): FieldErrors {
  const errors: FieldErrors = {};
  const email = input.email.trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (email.length > 254) {
    errors.email = 'Email address is too long.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (input.display_name.trim().length > 120) {
    errors.display_name = 'Display name is too long.';
  }
  if (input.interest && !INTEREST_OPTIONS.some((o) => o.value === input.interest)) {
    errors.interest = 'Please select a valid interest.';
  }
  if (!input.opted_in) {
    errors.opted_in = 'You must agree to receive updates to join the waitlist.';
  }
  return errors;
}

export default function EarlyAccessForm() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [interest, setInterest] = useState('');
  const [optedIn, setOptedIn] = useState(false);
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = validate({ email, display_name: displayName, interest, opted_in: optedIn });
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setState({ kind: 'idle' });
      return;
    }
    setFieldErrors({});
    setState({ kind: 'submitting' });
    try {
      const res = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          display_name: displayName.trim() || undefined,
          interest: interest || null,
          opted_in: optedIn,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setState({ kind: 'success', email: email.trim() });
        setEmail('');
        setDisplayName('');
        setInterest('');
        setOptedIn(false);
        return;
      }
      if (res.status === 409) {
        setFieldErrors({ email: 'This email is already on the waitlist.' });
        setState({ kind: 'error', message: 'This email is already on the waitlist.' });
        return;
      }
      if (res.status === 400 && Array.isArray(json.errors)) {
        const serverErrors: FieldErrors = {};
        for (const err of json.errors) {
          if (err.field && typeof err.message === 'string') {
            serverErrors[err.field as keyof FieldErrors] = err.message;
          }
        }
        setFieldErrors(serverErrors);
        setState({ kind: 'error', message: 'Please correct the highlighted fields.', fieldErrors: serverErrors });
        return;
      }
      setState({ kind: 'error', message: typeof json.error === 'string' ? json.error : 'Unable to save your registration. Please try again later.' });
    } catch {
      setState({ kind: 'error', message: 'A network error occurred. Please try again.' });
    }
  }

  if (state.kind === 'success') {
    return (
      <div style={{ padding: '2rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '0.75rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: '#22c55e', margin: '0 0 0.5rem', fontSize: '1.125rem' }}>You are on the list!</p>
        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>
          Thanks for your interest. We will reach out at <strong style={{ color: '#fafafa' }}>{state.email}</strong> when new milestones go live.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ padding: '2rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '1.25rem', textAlign: 'left' }}>
      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
          Email address <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={!!fieldErrors.email}
          style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid ' + (fieldErrors.email ? '#ef4444' : '#27272a'), borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        />
        {fieldErrors.email && <p style={{ color: '#ef4444', fontSize: '0.8125rem', margin: '0.375rem 0 0' }}>{fieldErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="display_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
          Name <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span>
        </label>
        <input
          id="display_name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          aria-invalid={!!fieldErrors.display_name}
          style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid ' + (fieldErrors.display_name ? '#ef4444' : '#27272a'), borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        />
        {fieldErrors.display_name && <p style={{ color: '#ef4444', fontSize: '0.8125rem', margin: '0.375rem 0 0' }}>{fieldErrors.display_name}</p>}
      </div>

      <div>
        <label htmlFor="interest" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
          Interest <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span>
        </label>
        <select
          id="interest"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          aria-invalid={!!fieldErrors.interest}
          style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid ' + (fieldErrors.interest ? '#ef4444' : '#27272a'), borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        >
          <option value="">Select an interest</option>
          {INTEREST_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {fieldErrors.interest && <p style={{ color: '#ef4444', fontSize: '0.8125rem', margin: '0.375rem 0 0' }}>{fieldErrors.interest}</p>}
      </div>

      <div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={optedIn}
            onChange={(e) => setOptedIn(e.target.checked)}
            aria-invalid={!!fieldErrors.opted_in}
            style={{ marginTop: '0.25rem', width: '1rem', height: '1rem', accentColor: '#3b82f6' }}
          />
          <span style={{ fontSize: '0.875rem', color: '#a1a1aa', lineHeight: 1.5 }}>
            I agree to receive updates about Xamcode milestones and releases.
          </span>
        </label>
        {fieldErrors.opted_in && <p style={{ color: '#ef4444', fontSize: '0.8125rem', margin: '0.375rem 0 0' }}>{fieldErrors.opted_in}</p>}
      </div>

      {state.kind === 'error' && !state.fieldErrors && (
        <div style={{ padding: '0.875rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={state.kind === 'submitting'}
        style={{ padding: '0.75rem 1.5rem', background: state.kind === 'submitting' ? '#2563eb' : '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, cursor: state.kind === 'submitting' ? 'not-allowed' : 'pointer', transition: 'background 0.15s ease' }}
      >
        {state.kind === 'submitting' ? 'Joining...' : 'Join the waitlist'}
      </button>

      <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0, lineHeight: 1.5 }}>
        No spam. We only reach out about meaningful milestones.
      </p>
    </form>
  );
}
