import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { fetchBipSummary, resolveBaseUrl } from './client';

const VALID_SUMMARY = {
  progress: { percent: 56, verifiedWeight: 56, totalWeight: 100, phase: 'Building' },
  roadmap: [{ id: 'rm_1', title: 'Pipeline', summary: 'Upload PDF', status: 'completed' }],
};

describe('bip client live fetch', () => {
  const fetchMock = vi.fn();
  const originalBaseUrl = process.env.BIP_BASE_URL;

  beforeEach(() => {
    process.env.BIP_BASE_URL = 'https://xamcode-ai.onrender.com';
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalBaseUrl === undefined) delete process.env.BIP_BASE_URL;
    else process.env.BIP_BASE_URL = originalBaseUrl;
  });

  it('returns ok with a normalized summary on HTTP 200', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify(VALID_SUMMARY) });
    const r = await fetchBipSummary();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.summary.progress.percent).toBe(56);
      expect(r.summary.roadmap[0]?.description).toBe('Upload PDF');
    }
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://xamcode-ai.onrender.com/api/bip/summary');
  });

  it('classifies HTTP 503 as an upstream failure carrying the status', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, text: async () => 'Service Unavailable' });
    const r = await fetchBipSummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Main API HTTP 503');
  });

  it('rejects malformed JSON bodies instead of trusting a 200', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => '<html>error page</html>' });
    const r = await fetchBipSummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Main API returned malformed JSON');
  });

  it('rejects a 200 payload that fails summary validation', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ nope: true }) });
    const r = await fetchBipSummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('Main API summary failed validation');
  });

  it('reports missing configuration without calling the network', async () => {
    delete process.env.BIP_BASE_URL;
    const r = await fetchBipSummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('BIP_BASE_URL is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('surfaces network errors from a failed fetch', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const r = await fetchBipSummary();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('connect ECONNREFUSED');
  });

  it('resolveBaseUrl enforces https in production', () => {
    expect(resolveBaseUrl({ BIP_BASE_URL: 'https://xamcode-ai.onrender.com', NODE_ENV: 'production' }).ok).toBe(true);
    expect(resolveBaseUrl({ BIP_BASE_URL: 'http://example.com', NODE_ENV: 'production' }).ok).toBe(false);
    expect(resolveBaseUrl({ BIP_BASE_URL: '', NODE_ENV: 'production' }).ok).toBe(false);
  });
});
