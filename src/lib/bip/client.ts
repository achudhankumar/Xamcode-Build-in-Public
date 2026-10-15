import 'server-only';
import { normalizeActivityList, normalizeIntegration, normalizeStatusBoard, normalizeSummary } from './normalize';
import type { BipEvent, BipIntegration, BipStatusBoard, BipSummary } from './types';

export const BIP_TIMEOUT_MS = 8000;
export const BIP_REVALIDATE_S = 60;

export function resolveBaseUrl(env: NodeJS.ProcessEnv = process.env): { ok: true; baseUrl: string } | { ok: false; reason: string } {
  const raw = (env.BIP_BASE_URL ?? '').trim();
  if (!raw) return { ok: false, reason: 'BIP_BASE_URL is not configured' };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false, reason: 'BIP_BASE_URL is not a valid URL' };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, reason: 'BIP_BASE_URL must be http(s)' };
  const host = u.hostname.toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (u.protocol === 'http:' && !isLocal && env.NODE_ENV === 'production') {
    return { ok: false, reason: 'BIP_BASE_URL must use HTTPS in production' };
  }
  return { ok: true, baseUrl: u.toString().replace(/\/+$/, '') };
}

export interface FetchResult {
  ok: boolean;
  data: unknown | null;
  httpStatus: number | null;
  error: string | null;
}

async function getJson(path: string, timeoutMs = BIP_TIMEOUT_MS): Promise<FetchResult> {
  const resolved = resolveBaseUrl();
  if (!resolved.ok) return { ok: false, data: null, httpStatus: null, error: resolved.reason };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(resolved.baseUrl + path, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'bip-website/phase1' },
      signal: ctrl.signal,
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, data: null, httpStatus: res.status, error: 'Main API HTTP ' + res.status };
    try {
      return { ok: true, data: JSON.parse(text), httpStatus: res.status, error: null };
    } catch {
      return { ok: false, data: null, httpStatus: res.status, error: 'Main API returned malformed JSON' };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch failed';
    const timeout = /abort|timeout/i.test(msg);
    return { ok: false, data: null, httpStatus: null, error: timeout ? 'Main API timed out (cold start?)' : msg };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchBipSummary(): Promise<{ ok: true; summary: BipSummary } | { ok: false; error: string }> {
  const r = await getJson('/api/bip/summary');
  if (!r.ok) return { ok: false, error: r.error ?? 'unavailable' };
  const s = normalizeSummary(r.data);
  if (!s) return { ok: false, error: 'Main API summary failed validation' };
  return { ok: true, summary: s };
}

export async function fetchBipActivity(limit = 20): Promise<{ ok: true; activity: BipEvent[]; integration: BipIntegration } | { ok: false; error: string }> {
  const n = Math.max(1, Math.min(50, Math.floor(limit) || 20));
  const r = await getJson('/api/bip/activity?limit=' + n);
  if (!r.ok) return { ok: false, error: r.error ?? 'unavailable' };
  const parsed = normalizeActivityList(r.data);
  if (!parsed) return { ok: false, error: 'Main API activity failed validation' };
  return { ok: true, activity: parsed.activity, integration: parsed.integration };
}

export async function fetchBipStatus(): Promise<{ ok: true; status: BipStatusBoard } | { ok: false; error: string }> {
  const r = await getJson('/api/bip/status');
  if (!r.ok) return { ok: false, error: r.error ?? 'unavailable' };
  const o = (r.data ?? {}) as Record<string, unknown>;
  if (!o.build && !o.tests && !o.deploy) return { ok: false, error: 'Main API status failed validation' };
  return { ok: true, status: normalizeStatusBoard(r.data) };
}

export function normalizeLaunchForTest(v: unknown) {
  const o = (v ?? {}) as Record<string, unknown>;
  const est = typeof o.estimated === 'string' ? o.estimated : null;
  const con = typeof o.confirmed === 'string' ? o.confirmed : null;
  return { estimated: est, confirmed: con, hasConfirmedDate: o.hasConfirmedDate === true };
}

export { normalizeIntegration };
