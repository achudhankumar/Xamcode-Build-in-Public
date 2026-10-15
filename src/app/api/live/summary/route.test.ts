import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchBipSummaryMock = vi.fn();
const resolveBaseUrlMock = vi.fn();

vi.mock('@/lib/bip/client', () => ({
  fetchBipSummary: () => fetchBipSummaryMock(),
  resolveBaseUrl: () => resolveBaseUrlMock(),
}));

import { GET } from './route';

const LIVE_SUMMARY = {
  requestId: 'r1',
  progress: {
    percent: 56,
    verifiedWeight: 56,
    totalWeight: 100,
    phase: 'Building',
    currentMilestone: null,
    counts: { verified: 5, inProgress: 2, needsReview: 0, planned: 3, total: 10 },
  },
  milestones: [{ id: 'ms_1', key: 'core-setup', title: 'Core setup', weight: 8, status: 'verified', criteria: 'Boots', evidence: 'docs', verifiedAt: '2026-10-09' }],
  launch: { readinessPercent: 56, readiness: 'Building', estimated: null, confirmed: null, note: '', countdownMs: null, estimatedCountdownMs: null, hasConfirmedDate: false },
  status: {
    build: { state: 'unknown', at: null, ref: null },
    tests: { state: 'unknown', at: null, ref: null },
    deploy: { state: 'unknown', at: null, ref: null },
    integration: { webhooks: true, ciIngest: true, live: true },
  },
  integration: { webhooks: true, ciIngest: true, live: true },
  roadmap: [{ id: 'rm_1', title: 'Pipeline', summary: 'Upload PDF', status: 'completed', updatedAt: '2026-10-09T00:00:00.000Z' }],
  recentActivity: [] as Array<Record<string, string>>,
  counts: { waitlist: 0, ideas: 0, chatMessages: 0, openReports: 0 },
};

function okConfig() {
  resolveBaseUrlMock.mockReturnValue({ ok: true, baseUrl: 'https://xamcode-ai.onrender.com' });
}

beforeEach(() => {
  fetchBipSummaryMock.mockReset();
  resolveBaseUrlMock.mockReset();
});

describe('GET /api/live/summary', () => {
  it('classifies a failed upstream as unavailable, not demo (HTTP 503 regression)', async () => {
    okConfig();
    fetchBipSummaryMock.mockResolvedValue({ ok: false, error: 'Main API HTTP 503' });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('unavailable');
    expect(body.honesty).toBe('main_unavailable');
    expect(body.reachable).toBe(false);
    expect(body.liveActivity).toBe(false);
    expect(body.error).toBe('Main API HTTP 503');
    expect(body.milestones).toEqual([]);
    expect(body.roadmap).toEqual([]);
    expect(body.recentActivity).toEqual([]);
    expect(body.progress.percent).toBe(0);
    expect(body.launch.readiness).toBe('Unavailable');
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('falls back to labeled demo only when BIP_BASE_URL is not configured', async () => {
    resolveBaseUrlMock.mockReturnValue({ ok: false, reason: 'BIP_BASE_URL is not configured' });
    const res = await GET();
    const body = await res.json();
    expect(body.source).toBe('demo');
    expect(body.honesty).toBe('demo');
    expect(body.reachable).toBe(false);
    // Seed data is fine here because it is explicitly labeled as demo.
    expect(body.milestones.length).toBeGreaterThan(0);
    expect(body.error).toContain('BIP_BASE_URL');
    expect(fetchBipSummaryMock).not.toHaveBeenCalled();
  });

  it('passes through live data with honest classification', async () => {
    okConfig();
    fetchBipSummaryMock.mockResolvedValue({ ok: true, summary: LIVE_SUMMARY });
    const res = await GET();
    const body = await res.json();
    expect(body.source).toBe('main');
    expect(body.reachable).toBe(true);
    expect(body.progress.percent).toBe(56);
    expect(body.roadmap).toHaveLength(1);
    // No delivered ci/webhook events yet, so live activity must not be claimed.
    expect(body.honesty).toBe('waiting_first_event');
    expect(body.liveActivity).toBe(false);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60');
  });

  it('CI ingest acknowledged (HTTP 200) without persisted events is not live activity', async () => {
    okConfig();
    // integration claims webhooks/ciIngest/live are configured, but
    // recentActivity is empty: an ingest ACK proves nothing about persistence.
    fetchBipSummaryMock.mockResolvedValue({ ok: true, summary: LIVE_SUMMARY });
    const body = await (await GET()).json();
    expect(body.integration.live).toBe(true);
    expect(body.recentActivity).toHaveLength(0);
    expect(body.honesty).not.toBe('live_activity');
    expect(body.liveActivity).toBe(false);
  });

  it('claims live activity only when a delivered ci/webhook event is readable', async () => {
    okConfig();
    fetchBipSummaryMock.mockResolvedValue({
      ok: true,
      summary: {
        ...LIVE_SUMMARY,
        recentActivity: [
          { id: 'ev1', type: 'tests_passed', summary: 'CI green', detail: 'vitest passed', ref: 'abc1234', status: 'passed', source: 'ci', at: '2026-10-15T00:00:00Z' },
        ],
      },
    });
    const body = await (await GET()).json();
    expect(body.honesty).toBe('live_activity');
    expect(body.liveActivity).toBe(true);
  });

  it('treats an unreachable main API (timeout) as unavailable, never demo', async () => {
    okConfig();
    fetchBipSummaryMock.mockResolvedValue({ ok: false, error: 'Main API timed out (cold start?)' });
    const body = await (await GET()).json();
    expect(body.source).toBe('unavailable');
    expect(body.honesty).toBe('main_unavailable');
    expect(body.error).toContain('timed out');
  });
});
