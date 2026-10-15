import { describe, expect, it } from 'vitest';
import {
  classifyHonestyForTest,
  HONESTY_LABELS_FOR_TEST,
  normalizeActivityList,
  normalizeBoardEntry,
  normalizeEvent,
  normalizeIntegration,
  normalizeLaunch,
  normalizeMilestone,
  normalizeProgress,
  normalizeRoadmapItem,
  normalizeStatusBoard,
  normalizeSummary,
  resolveBaseUrlForTest,
} from '@/lib/bip/normalize';

const REAL_SUMMARY = {
  requestId: 'r1',
  progress: { percent: 56, verifiedWeight: 56, totalWeight: 100, phase: 'Building', currentMilestone: null, counts: { verified: 5, inProgress: 2, needsReview: 0, planned: 3, total: 10 } },
  milestones: [{ id: 'ms_1', key: 'core-setup', title: 'Core setup', weight: 8, status: 'verified', criteria: 'Boots', evidence: 'docs', verifiedAt: '2026-10-09' }],
  launch: { readinessPercent: 56, readiness: 'Building', estimated: null, confirmed: null, note: '', countdownMs: null, estimatedCountdownMs: null, hasConfirmedDate: false },
  status: { build: { state: 'unknown', at: null, ref: null }, tests: { state: 'unknown', at: null, ref: null }, deploy: { state: 'unknown', at: null, ref: null }, integration: { webhooks: true, ciIngest: true, live: true } },
  integration: { webhooks: true, ciIngest: true, live: true },
  roadmap: [{ id: 'rm_1', title: 'Pipeline', summary: 'Upload PDF', status: 'completed', updatedAt: '2026-10-09T00:00:00.000Z' }],
  recentActivity: [],
  counts: { waitlist: 0, ideas: 0, chatMessages: 0, openReports: 0 },
};

describe('bip normalize', () => {
  it('normalizes the real summary shape', () => {
    const s = normalizeSummary(REAL_SUMMARY);
    expect(s?.progress.percent).toBe(56);
    expect(s?.roadmap[0]?.description).toBe('Upload PDF');
    expect(s?.integration.live).toBe(true);
  });

  it('drops events without summaries and clamps lengths', () => {
    expect(normalizeEvent({ summary: '' })).toBeNull();
    const e = normalizeEvent({ id: 'x', type: 'commit_pushed', summary: 'a'.repeat(900), source: 'ci', at: '2026-10-15T00:00:00Z' });
    expect(e?.summary.length).toBeLessThanOrEqual(500);
  });

  it('rejects malformed payloads', () => {
    expect(normalizeSummary(null)).toBeNull();
    expect(normalizeSummary({})).toBeNull();
    expect(normalizeActivityList({ activity: 'nope' })).toBeNull();
    expect(normalizeMilestone({ title: '' })).toBeNull();
    expect(normalizeRoadmapItem({})).toBeNull();
  });

  it('defaults unknown board states', () => {
    expect(normalizeBoardEntry({}).state).toBe('unknown');
    expect(normalizeStatusBoard({}).build.state).toBe('unknown');
    expect(normalizeProgress({}).percent).toBe(0);
  });

  it('honesty: empty feed is waiting, not live', () => {
    expect(classifyHonestyForTest({ reachable: false, events: [], progressPercent: 56 })).toBe('main_unavailable');
    expect(classifyHonestyForTest({ reachable: true, events: [], progressPercent: 56 })).toBe('waiting_first_event');
    expect(HONESTY_LABELS_FOR_TEST.waiting_first_event).toMatch(/Waiting/);
  });

  it('honesty: only ci/webhook sources count as live', () => {
    const seed = [{ summary: 'Seed', source: 'seed', at: '2026-10-09T00:00:00Z' }];
    expect(classifyHonestyForTest({ reachable: true, events: seed, progressPercent: 56 })).toBe('waiting_first_event');
    const live = [{ summary: 'CI green', source: 'ci', at: '2026-10-15T00:00:00Z' }];
    expect(classifyHonestyForTest({ reachable: true, events: live, progressPercent: 56 })).toBe('live_activity');
  });

  it('launch: estimated shown, countdown only when confirmed', () => {
    const est = normalizeLaunch({ estimated: '2026-12-01T00:00:00Z', confirmed: null, hasConfirmedDate: false });
    expect(est.hasConfirmedDate).toBe(false);
    const con = normalizeLaunch({ estimated: null, confirmed: '2026-12-01T00:00:00Z', hasConfirmedDate: true });
    expect(con.hasConfirmedDate).toBe(true);
  });

  it('integration.live means configured, not delivered', () => {
    expect(normalizeIntegration({ webhooks: true, ciIngest: true }).live).toBe(true);
    expect(normalizeIntegration({}).live).toBe(false);
  });

  it('base url validation keeps prod on https and server-side', () => {
    expect(resolveBaseUrlForTest({ BIP_BASE_URL: '' }).ok).toBe(false);
    expect(resolveBaseUrlForTest({ BIP_BASE_URL: 'http://example.com', NODE_ENV: 'production' }).ok).toBe(false);
    expect(resolveBaseUrlForTest({ BIP_BASE_URL: 'https://xamcode-ai.onrender.com', NODE_ENV: 'production' }).ok).toBe(true);
  });

  it('proxy responses never leak server env', () => {
    const payload = JSON.stringify(normalizeSummary(REAL_SUMMARY));
    expect(payload).not.toMatch(/BIP_INGEST_TOKEN|BIP_ADMIN_TOKEN|SERVICE_ROLE|SUPABASE_SERVICE/);
  });
});
