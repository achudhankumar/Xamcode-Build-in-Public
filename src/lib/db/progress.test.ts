import { describe, it, expect } from 'vitest';
import { computeProgressSummary, DEMO_MILESTONES, type ProgressMilestone } from './progress';

function milestone(overrides: Partial<ProgressMilestone>): ProgressMilestone {
  return {
    id: 'm',
    roadmap_item_id: 'r',
    roadmap_title: null,
    milestone_type: 'feature',
    title: 'Milestone',
    description: null,
    status: 'planned',
    weight: 1,
    ...overrides,
  };
}

describe('computeProgressSummary', () => {
  it('returns null percent when there are no milestones', () => {
    const summary = computeProgressSummary([]);
    expect(summary.total_weight).toBe(0);
    expect(summary.completed_weight).toBe(0);
    expect(summary.progress_percent).toBeNull();
    expect(summary.total_count).toBe(0);
  });

  it('does not count planned or in_progress as completed', () => {
    const summary = computeProgressSummary([
      milestone({ id: 'a', status: 'planned', weight: 5 }),
      milestone({ id: 'b', status: 'in_progress', weight: 5 }),
    ]);
    expect(summary.completed_weight).toBe(0);
    expect(summary.progress_percent).toBe(0);
    expect(summary.planned_count).toBe(1);
    expect(summary.in_progress_count).toBe(1);
    expect(summary.completion_count).toBe(0);
  });

  it('does not count completed (unverified) toward the verified percentage', () => {
    const summary = computeProgressSummary([
      milestone({ id: 'a', status: 'completed', weight: 10 }),
    ]);
    expect(summary.completed_weight).toBe(0);
    expect(summary.progress_percent).toBe(0);
    expect(summary.completion_count).toBe(1);
  });

  it('counts verified milestones by weight', () => {
    const summary = computeProgressSummary([
      milestone({ id: 'a', status: 'verified', weight: 1 }),
      milestone({ id: 'b', status: 'verified', weight: 1 }),
      milestone({ id: 'c', status: 'planned', weight: 2 }),
    ]);
    expect(summary.total_weight).toBe(4);
    expect(summary.completed_weight).toBe(2);
    expect(summary.progress_percent).toBe(50);
  });

  it('returns 100 when all milestones are verified', () => {
    const summary = computeProgressSummary([
      milestone({ id: 'a', status: 'verified', weight: 3 }),
      milestone({ id: 'b', status: 'verified', weight: 2 }),
    ]);
    expect(summary.progress_percent).toBe(100);
    expect(summary.total_count).toBe(2);
  });
});

describe('DEMO_MILESTONES', () => {
  it('contains no verified milestones so the percent is not fabricated upward', () => {
    expect(DEMO_MILESTONES.length).toBeGreaterThan(0);
    const summary = computeProgressSummary(DEMO_MILESTONES);
    expect(summary.progress_percent).toBe(0);
    expect(summary.total_count).toBe(DEMO_MILESTONES.length);
  });
});
