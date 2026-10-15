import { describe, it, expect } from 'vitest';
import { GET, type ProgressResponse } from './route';

async function readJson(response: Response): Promise<ProgressResponse> {
  return (await response.json()) as ProgressResponse;
}

describe('GET /api/progress', () => {
  it('returns demo milestones when Supabase is not configured', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.demo_mode).toBe(true);
    expect(body.milestones.length).toBeGreaterThan(0);
    expect(body.total_count).toBe(body.milestones.length);
  });

  it('does not fabricate a percentage when there is no verified weight', async () => {
    const response = await GET();
    const body = await readJson(response);
    expect(body.progress_percent).toBe(0);
    expect(body.completed_weight).toBe(0);
  });

  it('sets no-store cache headers', async () => {
    const response = await GET();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('separates planned, in-progress, and completed counts', async () => {
    const response = await GET();
    const body = await readJson(response);
    const sum = body.planned_count + body.in_progress_count + body.completion_count;
    expect(sum).toBeLessThanOrEqual(body.total_count);
  });
});
