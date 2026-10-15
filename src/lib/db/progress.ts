import { getSupabaseServerClientOrUndefined } from '@/lib/db/supabase';

export interface ProgressMilestone {
  id: string;
  roadmap_item_id: string;
  roadmap_title: string | null;
  milestone_type: 'feature' | 'improvement' | 'fix' | 'verification' | 'release';
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'verified';
  weight: number;
}

export interface ProgressSummary {
  total_weight: number;
  completed_weight: number;
  progress_percent: number | null;
  completion_count: number;
  in_progress_count: number;
  planned_count: number;
  total_count: number;
}

/**
 * Sample milestones used in demo mode (Supabase not configured).
 * Clearly labelled as sample content — does not claim real achievements.
 */
export const DEMO_MILESTONES: ProgressMilestone[] = [
  {
    id: 'demo-m1',
    roadmap_item_id: 'demo-1',
    roadmap_title: 'Public roadmap page',
    milestone_type: 'feature',
    title: 'Roadmap page scaffolded',
    description: 'Initial roadmap page structure in place.',
    status: 'completed',
    weight: 2,
  },
  {
    id: 'demo-m2',
    roadmap_item_id: 'demo-1',
    roadmap_title: 'Public roadmap page',
    milestone_type: 'verification',
    title: 'Roadmap filters verified',
    description: 'Search and status filters verified end to end.',
    status: 'in_progress',
    weight: 1,
  },
  {
    id: 'demo-m3',
    roadmap_item_id: 'demo-2',
    roadmap_title: 'Public progress dashboard',
    milestone_type: 'feature',
    title: 'Progress calculation logic',
    description: 'Weighted progress calculation implemented and unit tested.',
    status: 'planned',
    weight: 3,
  },
];

/**
 * Computes a transparent, weighted progress summary from milestone records.
 *
 * Rules:
 * - Only milestones with status `verified` count toward the completed weight.
 * - Milestones with status `completed` (but not yet `verified`) are tracked
 *   separately and do NOT count toward the verified percentage.
 * - `planned` and `in_progress` milestones are never counted as completed.
 * - If there are no milestones, `progress_percent` is `null` (not a fake 0%).
 */
export function computeProgressSummary(milestones: ProgressMilestone[]): ProgressSummary {
  const total_weight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const completed_weight = milestones
    .filter((m) => m.status === 'verified')
    .reduce((sum, m) => sum + m.weight, 0);

  const progress_percent =
    total_weight > 0 ? Math.round((completed_weight / total_weight) * 100) : null;

  const completion_count = milestones.filter(
    (m) => m.status === 'verified' || m.status === 'completed',
  ).length;
  const in_progress_count = milestones.filter((m) => m.status === 'in_progress').length;
  const planned_count = milestones.filter((m) => m.status === 'planned').length;

  return {
    total_weight,
    completed_weight,
    progress_percent,
    completion_count,
    in_progress_count,
    planned_count,
    total_count: milestones.length,
  };
}

/**
 * Fetches all progress milestones joined with their parent roadmap item title.
 * Throws when Supabase is not configured so callers can fall back to demo mode.
 */
export async function fetchProgressMilestones(): Promise<ProgressMilestone[]> {
  const client = getSupabaseServerClientOrUndefined();
  if (!client) {
    throw new Error('Database access requires Supabase configuration');
  }

  const { data, error } = await client
    .from('progress_records')
    .select(
      `
      id,
      roadmap_item_id,
      milestone_type,
      title,
      description,
      status,
      weight,
      roadmap_items!inner(title)
    `,
    )
    .order('weight', { ascending: false });

  if (error) {
    throw error;
  }

  type Row = {
    id: string;
    roadmap_item_id: string;
    milestone_type: ProgressMilestone['milestone_type'];
    title: string;
    description: string | null;
    status: ProgressMilestone['status'];
    weight: number;
    roadmap_items: { title: string }[] | { title: string } | null;
  };

  const rows = (data ?? []) as unknown as Row[];

  return rows.map((row) => {
    const roadmapItems = row.roadmap_items;
    const title = Array.isArray(roadmapItems)
      ? roadmapItems[0]?.title ?? null
      : roadmapItems?.title ?? null;

    return {
      id: row.id,
      roadmap_item_id: row.roadmap_item_id,
      roadmap_title: title,
      milestone_type: row.milestone_type,
      title: row.title,
      description: row.description,
      status: row.status,
      weight: row.weight,
    };
  });
}
