import { describe, it, expect } from 'vitest';
import { DEMO_ITEMS } from './roadmap/roadmap-route';

describe('roadmap demo data', () => {
  it('returns a stable set of demo items', () => {
    expect(DEMO_ITEMS).toHaveLength(4);
    expect(DEMO_ITEMS.map((item) => item.id)).toEqual([
      'demo-1',
      'demo-2',
      'demo-3',
      'demo-4',
    ]);
  });

  it('has one in_progress item in the demo set', () => {
    expect(DEMO_ITEMS.filter((item) => item.status === 'in_progress')).toHaveLength(1);
  });
});

describe('fetchRoadmapItems', () => {
  it('throws when Supabase is not configured', async () => {
    const { fetchRoadmapItems } = await import('./roadmap/roadmap-route');
    await expect(fetchRoadmapItems()).rejects.toThrow('Database access requires Supabase configuration');
  });
});
