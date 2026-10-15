import { getSupabaseServerClientOrUndefined } from '@/lib/db/supabase';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'released' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  effort_estimate: string | null;
  target_quarter: string | null;
  verification_notes: string | null;
  is_verified_completed: boolean;
  contributor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface RoadmapFilters {
  status?: string;
  search?: string;
}

/**
 * Sample roadmap items used in demo mode (Supabase not configured).
 * These are clearly labelled as sample content and do not claim real,
 * verified project achievements.
 */
export const DEMO_ITEMS: RoadmapItem[] = [
  {
    id: 'demo-1',
    title: 'Public roadmap page',
    description: 'A public roadmap page that reads live records from Supabase when configured.',
    status: 'in_progress',
    priority: 'high',
    category: 'Frontend',
    effort_estimate: null,
    target_quarter: null,
    verification_notes: 'Sample content — demo mode only.',
    is_verified_completed: false,
    contributor_id: null,
    created_by: null,
    created_at: '2024-01-10T00:00:00.000Z',
    updated_at: '2024-01-10T00:00:00.000Z',
    published_at: '2024-01-10T00:00:00.000Z',
  },
  {
    id: 'demo-2',
    title: 'Public progress dashboard',
    description: 'A transparent progress dashboard computed from weighted milestone records.',
    status: 'planned',
    priority: 'high',
    category: 'Frontend',
    effort_estimate: null,
    target_quarter: null,
    verification_notes: 'Sample content — demo mode only.',
    is_verified_completed: false,
    contributor_id: null,
    created_by: null,
    created_at: '2024-01-09T00:00:00.000Z',
    updated_at: '2024-01-09T00:00:00.000Z',
    published_at: '2024-01-09T00:00:00.000Z',
  },
  {
    id: 'demo-3',
    title: 'Public changelog',
    description: 'A versioned changelog page connected to the Supabase changelog entries table.',
    status: 'planned',
    priority: 'medium',
    category: 'Frontend',
    effort_estimate: null,
    target_quarter: null,
    verification_notes: 'Sample content — demo mode only.',
    is_verified_completed: false,
    contributor_id: null,
    created_by: null,
    created_at: '2024-01-08T00:00:00.000Z',
    updated_at: '2024-01-08T00:00:00.000Z',
    published_at: '2024-01-08T00:00:00.000Z',
  },
  {
    id: 'demo-4',
    title: 'Early-access waitlist',
    description: 'A validated early-access signup form backed by a private waitlist table.',
    status: 'planned',
    priority: 'medium',
    category: 'Backend',
    effort_estimate: null,
    target_quarter: null,
    verification_notes: 'Sample content — demo mode only.',
    is_verified_completed: false,
    contributor_id: null,
    created_by: null,
    created_at: '2024-01-07T00:00:00.000Z',
    updated_at: '2024-01-07T00:00:00.000Z',
    published_at: '2024-01-07T00:00:00.000Z',
  },
];

/**
 * Filters an in-memory list of roadmap items by status and free-text search.
 * Used for demo mode and as the client-side fallback.
 */
export function filterRoadmapItems(
  items: RoadmapItem[],
  status?: string | null,
  search?: string | null,
): RoadmapItem[] {
  let result = items;

  if (status && status !== 'all') {
    result = result.filter((item) => item.status === status);
  }

  if (search && search.trim().length > 0) {
    const term = search.trim().toLowerCase();
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term),
    );
  }

  return result;
}

/**
 * Fetches roadmap items from Supabase, optionally filtered by status and search.
 * Throws when Supabase is not configured so callers can fall back to demo mode.
 */
export async function fetchRoadmapItems(filters: RoadmapFilters = {}): Promise<RoadmapItem[]> {
  const client = getSupabaseServerClientOrUndefined();
  if (!client) {
    throw new Error('Database access requires Supabase configuration');
  }

  let query = client
    .from('roadmap_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim();
    query = query.or(
      `title.ilike.%${term},description.ilike.%${term},category.ilike.%${term}`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as RoadmapItem[];
}
