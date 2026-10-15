import { describe, it, expect } from 'vitest';
import { GET, type ChangelogResponse } from './route';

async function readJson(response: Response): Promise<ChangelogResponse> {
  return (await response.json()) as ChangelogResponse;
}

describe('GET /api/changelog', () => {
  it('returns demo entries when Supabase is not configured', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.demo_mode).toBe(true);
    expect(body.entries.length).toBeGreaterThan(0);
    expect(body.entries.map((e) => e.version)).toContain('0.2.0');
  });

  it('sets no-store cache headers', async () => {
    const response = await GET();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('does not set an error in demo mode', async () => {
    const response = await GET();
    const body = await readJson(response);
    expect(body.error).toBeUndefined();
  });
});
