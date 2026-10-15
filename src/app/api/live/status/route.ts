import { NextResponse } from 'next/server';
import { fetchBipStatus } from '@/lib/bip/client';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  const r = await fetchBipStatus();
  if (!r.ok) {
    return NextResponse.json(
      {
        source: 'unavailable' as const,
        honesty: 'main_unavailable' as const,
        reachable: false,
        liveActivity: false,
        build: { state: 'unknown', at: null, ref: null },
        tests: { state: 'unknown', at: null, ref: null },
        deploy: { state: 'unknown', at: null, ref: null },
        integration: { webhooks: false, ciIngest: false, live: false },
        error: r.error,
      },
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  }
  const hasReal = [r.status.build, r.status.tests, r.status.deploy].some(
    (b) => b.state !== 'unknown' && b.at,
  );
  return NextResponse.json(
    {
      source: 'main' as const,
      honesty: hasReal ? ('live_activity' as const) : ('waiting_first_event' as const),
      reachable: true,
      liveActivity: hasReal,
      ...r.status,
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60' } },
  );
}
