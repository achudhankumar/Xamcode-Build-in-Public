import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/constants';
import {
  DEMO_ENTRIES,
  fetchChangelogEntries,
  type ChangelogEntry,
} from '@/lib/db/changelog';

export interface ChangelogResponse {
  entries: ChangelogEntry[];
  demo_mode: boolean;
  error?: string;
}

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json<ChangelogResponse>(
      { entries: DEMO_ENTRIES, demo_mode: true },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }

  try {
    const entries = await fetchChangelogEntries();
    return NextResponse.json<ChangelogResponse>(
      { entries, demo_mode: false },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    console.error('Changelog API error:', error);
    return NextResponse.json<ChangelogResponse>(
      { entries: [], demo_mode: false, error: 'Failed to load changelog entries.' },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }
}
