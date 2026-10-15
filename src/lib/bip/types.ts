// Accurate TypeScript interfaces for the ACTUAL main Xamcode public API.
// Source: C:\Xamcode\bip\routes.js (publicSummary), bip\progress.js,
// bip\events.js (statusBoard/integrationStatus), bip\admin.js (publicLaunch).
// These shapes intentionally differ from the website's Supabase shapes.

export type BipEventType =
  | 'commit_pushed'
  | 'build_started'
  | 'build_passed'
  | 'build_failed'
  | 'tests_passed'
  | 'tests_failed'
  | 'deploy_started'
  | 'deploy_succeeded'
  | 'deploy_failed'
  | 'milestone_verified'
  | 'milestone_reopened'
  | 'release_published'
  | 'note';

export type BipEventStatus = 'passed' | 'failed' | 'running' | 'info' | string;
export type BipBoardState = 'passed' | 'failed' | 'running' | 'unknown' | string;

export interface BipEvent {
  id: string;
  type: string;
  summary: string;
  detail: string;
  ref: string;
  status: string;
  source: string;
  at: string;
}

export interface BipMilestoneCounts {
  verified: number;
  inProgress: number;
  needsReview: number;
  planned: number;
  total: number;
}

export interface BipProgress {
  percent: number;
  verifiedWeight: number;
  totalWeight: number;
  phase: string;
  currentMilestone: unknown | null;
  counts: BipMilestoneCounts;
}

export interface BipMilestone {
  id: string;
  key?: string;
  title: string;
  weight: number;
  status: string;
  criteria?: string | null;
  evidence?: string | null;
  verifiedAt?: string | null;
  [key: string]: unknown;
}

export interface BipBoardEntry {
  state: string;
  at: string | null;
  ref: string | null;
}

export interface BipIntegration {
  webhooks: boolean;
  ciIngest: boolean;
  live: boolean;
}

export interface BipStatusBoard {
  build: BipBoardEntry;
  tests: BipBoardEntry;
  deploy: BipBoardEntry;
  integration: BipIntegration;
}

export interface BipRoadmapItem {
  id: string;
  title: string;
  summary?: string;
  description?: string;
  status: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface BipLaunch {
  readinessPercent: number;
  readiness: string;
  estimated: string | null;
  confirmed: string | null;
  note: string;
  countdownMs: number | null;
  estimatedCountdownMs: number | null;
  hasConfirmedDate: boolean;
}

export interface BipSummary {
  requestId?: string;
  progress: BipProgress;
  milestones: BipMilestone[];
  launch: BipLaunch;
  status: BipStatusBoard;
  integration: BipIntegration;
  roadmap: BipRoadmapItem[];
  recentActivity: BipEvent[];
  ideas?: unknown[];
  counts?: {
    waitlist: number;
    ideas: number;
    chatMessages: number;
    openReports: number;
  };
}

export type LiveSource = 'main' | 'cached' | 'supabase' | 'demo' | 'unavailable';

/** Honest UI state — never claim live activity from seeded/empty data. */
export type LiveHonesty =
  | 'live_activity'
  | 'waiting_first_event'
  | 'seeded_progress'
  | 'main_unavailable'
  | 'demo';

/**
 * Classify honesty from a normalized payload.
 * integration.live only means ingestion is CONFIGURED, not delivered.
 * Live activity requires >=1 event with a real source + timestamp.
 */
export function classifyHonesty(args: {
  reachable: boolean;
  events: BipEvent[];
  progressPercent: number | null;
}): LiveHonesty {
  if (!args.reachable) return 'main_unavailable';
  const real = (args.events ?? []).filter(
    (e) =>
      e &&
      typeof e.summary === 'string' &&
      e.summary.trim().length > 0 &&
      typeof e.at === 'string' &&
      e.at.trim().length > 0 &&
      (e.source === 'ci' || e.source === 'webhook' || e.source === 'admin' || e.source === 'seed'),
  );
  // Only non-seed sources count as delivered live activity.
  const delivered = real.filter((e) => e.source === 'ci' || e.source === 'webhook');
  if (delivered.length > 0) return 'live_activity';
  if ((args.progressPercent ?? 0) > 0) return 'waiting_first_event';
  return 'seeded_progress';
}

export const HONESTY_LABELS: Record<LiveHonesty, string> = {
  live_activity: 'Live activity received',
  waiting_first_event: 'Waiting for first real event',
  seeded_progress: 'Seeded project progress',
  main_unavailable: 'Main API temporarily unavailable',
  demo: 'Demo data',
};
