import { getSupabaseServerClientOrUndefined } from '@/lib/db/supabase';

export interface ChangelogEntry {
  version: string;
  summary: string;
  body: string | null;
  features: string[] | null;
  improvements: string[] | null;
  fixes: string[] | null;
  limitations: string[] | null;
  published_at: string | null;
}

/**
 * Sample changelog entries used in demo mode (Supabase not configured).
 * Clearly labelled as sample content — does not claim real releases.
 */
export const DEMO_ENTRIES: ChangelogEntry[] = [
  {
    version: '0.2.0',
    summary: 'Public pages connected to Supabase sample records.',
    body: 'This release connects the public roadmap, progress, and changelog pages to Supabase sample records. The content is sample content only.',
    features: ['Roadmap page reads live roadmap items.'],
    improvements: ['Progress page calculates completion from milestones.'],
    fixes: [],
    limitations: ['Content is sample content.'],
    published_at: '2024-02-01T00:00:00.000Z',
  },
  {
    version: '0.1.0',
    summary: 'Public project foundation deployed.',
    body: 'The initial public project foundation is deployed with a Supabase-backed schema and demo-mode fallback.',
    features: ['Public pages with demo-mode fallback.'],
    improvements: [],
    fixes: [],
    limitations: ['No authentication yet.', 'Sample content.'],
    published_at: '2024-01-15T00:00:00.000Z',
  },
];

/**
 * Fetches changelog entries from Supabase, newest first.
 * Throws when Supabase is not configured so callers can fall back to demo mode.
 */
export async function fetchChangelogEntries(): Promise<ChangelogEntry[]> {
  const client = getSupabaseServerClientOrUndefined();
  if (!client) {
    throw new Error('Database access requires Supabase configuration');
  }

  const { data, error } = await client
    .from('changelog_entries')
    .select('*')
    .order('published_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ChangelogEntry[];
}
