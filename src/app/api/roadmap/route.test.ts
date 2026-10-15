import { describe, it, expect } from 'vitest';
import { GET, type RoadmapApiResponse } from './route';

async function readJson(response: Response): Promise<RoadmapApiResponse> {
  return (await response.json()) as RoadmapApiResponse;
}

describe('GET /api/roadmap', () => {
  it('returns demo items when Supabase is not configured', async () => {
    const response = await GET(new Request('http://localhost/api/roadmap'));
    expect(response.status).toBe(200);
    const body = await readJson(response);
    expect(body.demo_mode).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.map((i) => i.id)).toContain('demo-1');
  });

  it('sets no-store cache headers', async () => {
    const response = await GET(new Request('http://localhost/api/roadmap'));
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('filters demo items by status via query params', async () => {
    const request = new Request('http://localhost/api/roadmap?status=in_progress');
    const response = await GET(request);
    const body = await readJson(response);
    expect(body.items.every((i) => i.status === 'in_progress')).toBe(true);
    expect(body.items.length).toBe(1);
  });

  it('filters demo items by search term', async () => {
    const request = new Request('http://localhost/api/roadmap?search=changelog');
    const response = await GET(request);
    const body = await readJson(response);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.every((i) => /changelog/i.test(i.title + i.description))).toBe(true);
  });
});
