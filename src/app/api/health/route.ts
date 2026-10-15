import { NextResponse } from 'next/server';
import { getDbHealth } from '@/lib/db/supabase';

export async function GET() {
  const health = await getDbHealth();

  return NextResponse.json(
    {
      configured: health.configured,
      reachable: health.reachable,
      demo_mode: health.demo_mode,
      error: health.error,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    },
  );
}
