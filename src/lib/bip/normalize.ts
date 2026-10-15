import type {
  BipBoardEntry,
  BipEvent,
  BipIntegration,
  BipLaunch,
  BipMilestone,
  BipProgress,
  BipRoadmapItem,
  BipStatusBoard,
  BipSummary,
} from './types';

export const BIP_TIMEOUT_MS = 8000;

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function nullStr(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function num(v: unknown, fb = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fb;
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function clean(v: unknown, max: number): string {
  let s = typeof v === 'string' ? v : '';
  s = s.replace(/[-]/g, '');
  return s.length > max ? s.slice(0, max) : s;
}

export function normalizeEvent(v: unknown): BipEvent | null {
  const o = rec(v);
  const summary = clean(o.summary, 500);
  if (!summary) return null;
  return {
    id: str(o.id) || 'ev_unknown',
    type: str(o.type) || 'note',
    summary,
    detail: clean(o.detail, 1000),
    ref: clean(o.ref, 80),
    status: str(o.status) || 'info',
    source: str(o.source) || 'unknown',
    at: str(o.at),
  };
}

export function normalizeBoardEntry(v: unknown): BipBoardEntry {
  const o = rec(v);
  return { state: str(o.state) || 'unknown', at: nullStr(o.at), ref: nullStr(o.ref) };
}

export function normalizeIntegration(v: unknown): BipIntegration {
  const o = rec(v);
  const w = o.webhooks === true;
  const c = o.ciIngest === true;
  return { webhooks: w, ciIngest: c, live: w || c };
}

export function normalizeProgress(v: unknown): BipProgress {
  const o = rec(v);
  const c = rec(o.counts);
  return {
    percent: num(o.percent, 0),
    verifiedWeight: num(o.verifiedWeight, 0),
    totalWeight: num(o.totalWeight, 0),
    phase: str(o.phase) || 'Building',
    currentMilestone: (o.currentMilestone as unknown) ?? null,
    counts: {
      verified: num(c.verified, 0),
      inProgress: num(c.inProgress, 0),
      needsReview: num(c.needsReview, 0),
      planned: num(c.planned, 0),
      total: num(c.total, 0),
    },
  };
}

export function normalizeMilestone(v: unknown): BipMilestone | null {
  const o = rec(v);
  const title = clean(o.title, 200);
  if (!title) return null;
  return {
    id: str(o.id) || str(o.key) || 'ms_unknown',
    key: str(o.key) || undefined,
    title,
    weight: num(o.weight, 0),
    status: str(o.status) || 'planned',
    criteria: nullStr(o.criteria),
    evidence: nullStr(o.evidence),
    verifiedAt: nullStr(o.verifiedAt),
  };
}

export function normalizeRoadmapItem(v: unknown): BipRoadmapItem | null {
  const o = rec(v);
  const title = clean(o.title, 200);
  if (!title) return null;
  const summary = clean(o.summary ?? o.description, 1000);
  return {
    id: str(o.id) || 'rm_unknown',
    title,
    summary,
    description: summary,
    status: str(o.status) || 'planned',
    updatedAt: str(o.updatedAt) || undefined,
  };
}

export function normalizeLaunch(v: unknown): BipLaunch {
  const o = rec(v);
  return {
    readinessPercent: num(o.readinessPercent, 0),
    readiness: str(o.readiness) || 'Early build',
    estimated: nullStr(o.estimated),
    confirmed: nullStr(o.confirmed),
    note: clean(o.note, 500),
    countdownMs: typeof o.countdownMs === 'number' && Number.isFinite(o.countdownMs) ? o.countdownMs : null,
    estimatedCountdownMs: typeof o.estimatedCountdownMs === 'number' && Number.isFinite(o.estimatedCountdownMs) ? o.estimatedCountdownMs : null,
    hasConfirmedDate: o.hasConfirmedDate === true,
  };
}

export function normalizeStatusBoard(v: unknown): BipStatusBoard {
  const o = rec(v);
  return {
    build: normalizeBoardEntry(o.build),
    tests: normalizeBoardEntry(o.tests),
    deploy: normalizeBoardEntry(o.deploy),
    integration: normalizeIntegration(o.integration),
  };
}

export function normalizeSummary(raw: unknown): BipSummary | null {
  const o = rec(raw);
  if (!o.progress) return null;
  const events = Array.isArray(o.recentActivity)
    ? (o.recentActivity as unknown[]).map(normalizeEvent).filter((e): e is BipEvent => e !== null)
    : [];
  const milestones = Array.isArray(o.milestones)
    ? (o.milestones as unknown[]).map(normalizeMilestone).filter((m): m is BipMilestone => m !== null)
    : [];
  const roadmap = Array.isArray(o.roadmap)
    ? (o.roadmap as unknown[]).map(normalizeRoadmapItem).filter((r): r is BipRoadmapItem => r !== null)
    : [];
  const counts = rec(o.counts);
  return {
    requestId: str(o.requestId) || undefined,
    progress: normalizeProgress(o.progress),
    milestones,
    launch: normalizeLaunch(o.launch),
    status: normalizeStatusBoard(o.status),
    integration: normalizeIntegration(o.integration ?? rec(o.status).integration),
    roadmap,
    recentActivity: events,
    counts: {
      waitlist: num(counts.waitlist, 0),
      ideas: num(counts.ideas, 0),
      chatMessages: num(counts.chatMessages, 0),
      openReports: num(counts.openReports, 0),
    },
  };
}

export function normalizeActivityList(raw: unknown): { activity: BipEvent[]; integration: BipIntegration } | null {
  const o = rec(raw);
  if (!Array.isArray(o.activity)) return null;
  return {
    activity: (o.activity as unknown[]).map(normalizeEvent).filter((e): e is BipEvent => e !== null),
    integration: normalizeIntegration(o.integration),
  };
}

export function classifyHonestyForTest(args: {
  reachable: boolean;
  events: { summary: string; at: string; source: string }[];
  progressPercent: number | null;
}): string {
  if (!args.reachable) return 'main_unavailable';
  const real = (args.events ?? []).filter(
    (e) => e && e.summary.trim().length > 0 && e.at.trim().length > 0,
  );
  const delivered = real.filter((e) => e.source === 'ci' || e.source === 'webhook');
  if (delivered.length > 0) return 'live_activity';
  if ((args.progressPercent ?? 0) > 0) return 'waiting_first_event';
  return 'seeded_progress';
}

export const HONESTY_LABELS_FOR_TEST: Record<string, string> = {
  live_activity: 'Live activity received',
  waiting_first_event: 'Waiting for first real event',
  seeded_progress: 'Seeded project progress',
  main_unavailable: 'Main API temporarily unavailable',
  demo: 'Demo data',
};

export function resolveBaseUrlForTest(env: Record<string, string | undefined>): { ok: boolean } {
  const raw = (env.BIP_BASE_URL ?? '').trim();
  if (!raw) return { ok: false };
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return { ok: false };
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false };
  const host = u.hostname.toLowerCase();
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (u.protocol === 'http:' && !isLocal && env.NODE_ENV === 'production') return { ok: false };
  return { ok: true };
}
