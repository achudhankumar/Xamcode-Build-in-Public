import { NextResponse } from 'next/server';
import { fetchBipSummary, resolveBaseUrl } from '@/lib/bip/client';
import { classifyHonesty } from '@/lib/bip/types';
import { DEMO_MILESTONES, computeProgressSummary } from '@/lib/db/progress';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

function demoFallback(reason: string) {
  const summary = computeProgressSummary(DEMO_MILESTONES);
  return NextResponse.json(
    {
      source: 'demo' as const,
      honesty: 'demo' as const,
      reachable: false,
      liveActivity: false,
      error: reason,
      progress: {
        percent: summary.progress_percent ?? 0,
        verifiedWeight: summary.completed_weight,
        totalWeight: summary.total_weight,
        phase: 'Demo',
        counts: {
          verified: 0,
          inProgress: summary.in_progress_count,
          needsReview: 0,
          planned: summary.planned_count,
          total: summary.total_count,
        },
      },
      milestones: DEMO_MILESTONES.map((m) => ({
        id: m.id,
        title: m.title,
        weight: m.weight,
        status: m.status,
        criteria: null,
        evidence: null,
        verifiedAt: null,
      })),
      launch: {
        readinessPercent: summary.progress_percent ?? 0,
        readiness: 'Demo',
        estimated: null,
        confirmed: null,
        note: '',
        countdownMs: null,
        estimatedCountdownMs: null,
        hasConfirmedDate: false,
      },
      status: {
        build: { state: 'unknown', at: null, ref: null },
        tests: { state: 'unknown', at: null, ref: null },
        deploy: { state: 'unknown', at: null, ref: null },
      },
      integration: { webhooks: false, ciIngest: false, live: false },
      roadmap: [],
      recentActivity: [],
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
}

// Upstream failure (e.g. HTTP 503, timeout, validation): never present seeded
// demo numbers as live data. Emit an honest unavailable payload instead.
function unavailableFallback(reason: string) {
  return NextResponse.json(
    {
      source: 'unavailable' as const,
      honesty: 'main_unavailable' as const,
      reachable: false,
      liveActivity: false,
      error: reason,
      progress: {
        percent: 0,
        verifiedWeight: 0,
        totalWeight: 0,
        phase: 'Unavailable',
        counts: { verified: 0, inProgress: 0, needsReview: 0, planned: 0, total: 0 },
      },
      milestones: [],
      launch: {
        readinessPercent: 0,
        readiness: 'Unavailable',
        estimated: null,
        confirmed: null,
        note: '',
        countdownMs: null,
        estimatedCountdownMs: null,
        hasConfirmedDate: false,
      },
      status: {
        build: { state: 'unknown', at: null, ref: null },
        tests: { state: 'unknown', at: null, ref: null },
        deploy: { state: 'unknown', at: null, ref: null },
      },
      integration: { webhooks: false, ciIngest: false, live: false },
      roadmap: [],
      recentActivity: [],
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
}

export async function GET() {
  // Missing/invalid BIP_BASE_URL is a configuration state (demo), while a
  // failed upstream fetch must classify as 'unavailable' so the UI never
  // shows seeded demo progress as if it were live production data.
  const cfg = resolveBaseUrl();
  if (!cfg.ok) return demoFallback(cfg.reason);
  const r = await fetchBipSummary();
  if (!r.ok) return unavailableFallback(r.error);
  const s = r.summary;
  const honesty = classifyHonesty({
    reachable: true,
    events: s.recentActivity,
    progressPercent: s.progress.percent,
  });
  return NextResponse.json(
    {
      source: 'main' as const,
      honesty,
      reachable: true,
      liveActivity: honesty === 'live_activity',
      progress: s.progress,
      milestones: s.milestones,
      launch: s.launch,
      status: s.status,
      integration: s.integration,
      roadmap: s.roadmap,
      recentActivity: s.recentActivity,
      counts: s.counts,
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60' } },
  );
}
