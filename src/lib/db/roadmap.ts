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
