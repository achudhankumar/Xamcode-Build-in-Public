import { describe, it, expect } from 'vitest';
import { getDbHealth } from './supabase';

describe('getDbHealth', () => {
  it('reports demo mode when Supabase is not configured', async () => {
    const health = await getDbHealth();
    expect(health.configured).toBe(false);
    expect(health.demo_mode).toBe(true);
    expect(health.reachable).toBe(false);
    expect(health.error).toBeNull();
  });
});
