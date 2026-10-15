import { describe, it, expect } from 'vitest';
import { DEMO_ENTRIES, fetchChangelogEntries } from './changelog';

describe('DEMO_ENTRIES', () => {
  it('has the expected sample versions', () => {
    expect(DEMO_ENTRIES.length).toBeGreaterThan(0);
    const versions = DEMO_ENTRIES.map((e) => e.version);
    expect(versions).toContain('0.2.0');
    expect(versions).toContain('0.1.0');
  });

  it('labels its content as sample/demo content', () => {
    for (const entry of DEMO_ENTRIES) {
      const blob = [entry.summary, entry.body, ...(entry.limitations ?? [])]
        .join(' ')
        .toLowerCase();
      expect(blob).toContain('sample');
    }
  });
});

describe('fetchChangelogEntries', () => {
  it('throws when Supabase is not configured', async () => {
    await expect(fetchChangelogEntries()).rejects.toThrow(
      'Database access requires Supabase configuration',
    );
  });
});
