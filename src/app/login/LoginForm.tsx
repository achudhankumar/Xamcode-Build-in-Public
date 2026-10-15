'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';
type State =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'error'; message: string }
  | { kind: 'check_email' };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') ?? '/';

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [state, setState] = useState<State>({ kind: 'idle' });

  const urlError = searchParams.get('error');
  const urlErrorMessage =
    urlError === 'not_configured'
      ? 'Sign-in is unavailable because Supabase is not configured.'
      : urlError === 'auth_failed'
        ? 'Sign-in failed. Please try again.'
        : urlError === 'missing_code'
          ? 'Sign-in link was invalid or expired.'
          : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setState({ kind: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (password.length < 8) {
      setState({ kind: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }

    setState({ kind: 'busy' });
    const supabase = createClient();

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { display_name: displayName.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
      // If email confirmation is on, there is no session yet.
      if (!data.session) {
        setState({ kind: 'check_email' });
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (error) {
        setState({ kind: 'error', message: error.message });
        return;
      }
    }

    router.push(nextPath);
    router.refresh();
  }

  if (state.kind === 'check_email') {
    return (
      <div style={{ padding: '2rem', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '0.75rem', textAlign: 'center' }}>
        <p style={{ fontWeight: 700, color: '#3b82f6', margin: '0 0 0.5rem' }}>Check your email</p>
        <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.9375rem', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: '#fafafa' }}>{email}</strong>. Confirm it, then sign in.
        </p>
      </div>
    );
  }

  const busy = state.kind === 'busy';

  return (
    <form onSubmit={handleSubmit} noValidate style={{ padding: '1.75rem', background: '#111113', border: '1px solid #27272a', borderRadius: '0.75rem', display: 'grid', gap: '1rem' }}>
      {urlErrorMessage && (
        <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          {urlErrorMessage}
        </div>
      )}

      {mode === 'signup' && (
        <div>
          <label htmlFor="display_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
            Display name
          </label>
          <input
            id="display_name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How you will appear"
            style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#fafafa', marginBottom: '0.375rem' }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          style={{ width: '100%', padding: '0.625rem 0.875rem', background: '#18181b', border: '1px solid #27272a', borderRadius: '0.5rem', color: '#fafafa', fontSize: '0.9375rem', outline: 'none' }}
        />
      </div>

      {state.kind === 'error' && (
        <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', color: '#ef4444', fontSize: '0.875rem' }}>
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        style={{ padding: '0.75rem 1.5rem', background: busy ? '#2563eb' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer' }}
      >
        {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      <button
        type="button"
        onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setState({ kind: 'idle' }); }}
        style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.875rem', cursor: 'pointer', textDecoration: 'underline' }}
      >
        {mode === 'signin' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', color: '#71717a' }}>Loading…</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
