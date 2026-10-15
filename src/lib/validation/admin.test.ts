import { describe, it, expect } from 'vitest';
import {
  validateRoadmapItem,
  validateMilestone,
  validateChangelogEntry,
} from './admin';

function validRoadmap() {
  return {
    title: 'Ship the admin dashboard',
    description: 'Build the admin area for content management.',
    status: 'in_progress',
    priority: 'high',
    category: 'Frontend',
  };
}

describe('validateRoadmapItem', () => {
  it('accepts a valid item', () => {
    expect(validateRoadmapItem(validRoadmap())).toEqual([]);
  });

  it('rejects a bad status', () => {
    const errors = validateRoadmapItem({ ...validRoadmap(), status: 'done' });
    expect(errors.some((e) => e.field === 'status')).toBe(true);
  });

  it('rejects a bad priority', () => {
    const errors = validateRoadmapItem({ ...validRoadmap(), priority: 'urgent' });
    expect(errors.some((e) => e.field === 'priority')).toBe(true);
  });

  it('rejects a short title', () => {
    const errors = validateRoadmapItem({ ...validRoadmap(), title: 'x' });
    expect(errors.some((e) => e.field === 'title')).toBe(true);
  });

  it('rejects a missing description', () => {
    const errors = validateRoadmapItem({ ...validRoadmap(), description: '' });
    expect(errors.some((e) => e.field === 'description')).toBe(true);
  });
});

describe('validateMilestone', () => {
  const valid = {
    roadmap_item_id: '00000000-0000-0000-0000-000000000001',
    milestone_type: 'feature',
    title: 'Admin dashboard',
    status: 'completed',
    weight: 5,
  };

  it('accepts a valid milestone', () => {
    expect(validateMilestone(valid)).toEqual([]);
  });

  it('rejects weight above 100', () => {
    expect(validateMilestone({ ...valid, weight: 101 }).some((e) => e.field === 'weight')).toBe(true);
  });

  it('rejects zero/negative weight', () => {
    expect(validateMilestone({ ...valid, weight: 0 }).some((e) => e.field === 'weight')).toBe(true);
    expect(validateMilestone({ ...valid, weight: -3 }).some((e) => e.field === 'weight')).toBe(true);
  });

  it('rejects non-numeric weight', () => {
    expect(validateMilestone({ ...valid, weight: '10' }).some((e) => e.field === 'weight')).toBe(true);
  });

  it('rejects an invalid status', () => {
    expect(validateMilestone({ ...valid, status: 'done' }).some((e) => e.field === 'status')).toBe(true);
  });
});

describe('validateChangelogEntry', () => {
  const valid = { version: '1.2.0', summary: 'Admin dashboard shipped.' };

  it('accepts a valid entry', () => {
    expect(validateChangelogEntry(valid)).toEqual([]);
  });

  it('accepts a prerelease version', () => {
    expect(validateChangelogEntry({ ...valid, version: '2.0.0-beta.1' })).toEqual([]);
  });

  it('rejects a non-semver version', () => {
    expect(validateChangelogEntry({ ...valid, version: 'v1' }).some((e) => e.field === 'version')).toBe(true);
  });

  it('rejects a short summary', () => {
    expect(validateChangelogEntry({ ...valid, summary: 'x' }).some((e) => e.field === 'summary')).toBe(true);
  });

  it('rejects non-string list entries', () => {
    const errors = validateChangelogEntry({ ...valid, features: ['ok', 42] });
    expect(errors.some((e) => e.field === 'features')).toBe(true);
  });

  it('accepts null lists', () => {
    expect(validateChangelogEntry({ ...valid, features: null, fixes: null })).toEqual([]);
  });
});
