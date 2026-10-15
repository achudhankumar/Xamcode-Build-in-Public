import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/constants';
import {
  DEMO_MILESTONES,
  computeProgressSummary,
  fetchProgressMilestones,
  type ProgressMilestone,
} from '@/lib/db/progress';

export interface ProgressResponse {
  milestones: ProgressMilestone[];
  total_weight: number;
  completed_weight: number;
  progress_percent: number | null;
  completion_count: number;
  in_progress_count: number;
  planned_count: number;
  total_count: number;
  demo_mode: boolean;
  error?: string;
}

export async function GET() {
  if (!isSupabaseConfigured) {
    const summary = computeProgressSummary(DEMO_MILESTONES);
    return NextResponse.json<ProgressResponse>(
      {
        milestones: DEMO_MILESTONES,
        ...summary,
        demo_mode: true,
      },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }

  try {
    const milestones = await fetchProgressMilestones();
    const summary = computeProgressSummary(milestones);
    return NextResponse.json<ProgressResponse>(
      { milestones, ...summary, demo_mode: false },
      {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  } catch (error) {
    console.error('Progress API error:', error);
    return NextResponse.json<ProgressResponse>(
      {
        milestones: [],
        total_weight: 0,
        completed_weight: 0,
        progress_percent: null,
        completion_count: 0,
        in_progress_count: 0,
        planned_count: 0,
        total_count: 0,
        demo_mode: false,
        error: 'Failed to load progress data.',
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      },
    );
  }
}
