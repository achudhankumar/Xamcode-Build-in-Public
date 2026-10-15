import { NextResponse } from 'next/server';
import { fetchBipActivity } from '@/lib/bip/client';
import { classifyHonesty } from '@/lib/bip/types';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const r = await fetchBipActivity(limit);
  if (!r.ok) {
    return NextResponse.json(
      {
        source: 'unavailable' as const,
        honesty: 'main_unavailable' as const,
        reachable: false,
        liveActivity: false,
        activity: [],
        integration: { webhooks: false, ciIngest: false, live: false },
        error: r.error,
      },
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
    );
  }
  const honesty = classifyHonesty({ reachable: true, events: r.activity, progressPercent: 0 });
  return NextResponse.json(
    {
      source: 'main' as const,
      honesty,
      reachable: true,
      liveActivity: honesty === 'live_activity',
      activity: r.activity,
      integration: r.integration,
    },
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=0, s-maxage=60' } },
  );
}
