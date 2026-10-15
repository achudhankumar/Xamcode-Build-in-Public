import { describe, it, expect } from 'vitest';
import { runSeedDemo } from './seed';

describe('runSeedDemo', () => {
  it('reports demo mode without touching a database', async () => {
    const result = await runSeedDemo();
    expect(result.demo_mode).toBe(true);
    expect(result.config_checked).toBe(false);
    expect(result.roadmaps_upserted).toBe(0);
    expect(result.progress_upserted).toBe(0);
    expect(result.changelog_upserted).toBe(0);
  });
});
