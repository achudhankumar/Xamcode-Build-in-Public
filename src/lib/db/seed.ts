import { createClient } from '@supabase/supabase-js';

interface SeedConfig {
  url: string;
  serviceRoleKey: string;
}

const ROADMAP_ITEM_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
];

const PROGRESS_RECORD_IDS = [
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000302',
  '00000000-0000-0000-0000-000000000401',
];

const CHANGELOG_VERSIONS = ['0.2.0', '0.1.0'];

function makeClient(config: SeedConfig) {
  return createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface RoadmapSeedItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'released' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  verification_notes: string | null;
  is_verified_completed: boolean;
}

export interface ProgressSeedRecord {
  id: string;
  roadmap_item_id: string;
  milestone_type: 'feature' | 'improvement' | 'fix' | 'verification' | 'release';
  title: string;
  description: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'verified';
  weight: number;
}

export interface ChangelogSeedEntry {
  version: string;
  summary: string;
  body: string | null;
  features: string[] | null;
  improvements: string[] | null;
  fixes: string[] | null;
  limitations: string[] | null;
}

const ROADMAP_SEED: RoadmapSeedItem[] = [
  {
    id: ROADMAP_ITEM_IDS[0],
    title: 'Project foundation and tooling',
    description: 'Initial repository setup and development tooling. Sample content.',
    status: 'completed',
    priority: 'critical',
    category: 'Infrastructure',
    verification_notes: 'Sample content. Template only — not a verified achievement.',
    is_verified_completed: false,
  },
  {
    id: ROADMAP_ITEM_IDS[1],
    title: 'Public roadmap page',
    description: 'A public roadmap page connected to the Supabase database. Sample content.',
    status: 'in_progress',
    priority: 'high',
    category: 'Frontend',
    verification_notes: 'Sample content. Template only — not a verified achievement.',
    is_verified_completed: false,
  },
  {
    id: ROADMAP_ITEM_IDS[2],
    title: 'Public progress dashboard',
    description: 'A public progress dashboard based on milestone completion. Sample content.',
    status: 'planned',
    priority: 'high',
    category: 'Frontend',
    verification_notes: 'Sample content. Template only — not a verified achievement.',
    is_verified_completed: false,
  },
  {
    id: ROADMAP_ITEM_IDS[3],
    title: 'Public changelog',
    description: 'A public changelog connected to the Supabase database. Sample content.',
    status: 'planned',
    priority: 'medium',
    category: 'Frontend',
    verification_notes: 'Sample content. Template only — not a verified achievement.',
    is_verified_completed: false,
  },
];

const PROGRESS_SEED: ProgressSeedRecord[] = [
  {
    id: PROGRESS_RECORD_IDS[0],
    roadmap_item_id: ROADMAP_ITEM_IDS[0],
    milestone_type: 'release',
    title: 'Repository and toolchain ready',
    description: 'Initial repository and build tooling in place. Sample content.',
    status: 'verified',
    weight: 1,
  },
  {
    id: PROGRESS_RECORD_IDS[1],
    roadmap_item_id: ROADMAP_ITEM_IDS[0],
    milestone_type: 'verification',
    title: 'Sample content verified as sample',
    description: 'Marked completed but not verified, so it does not count toward the verified percentage. Sample content.',
    status: 'completed',
    weight: 1,
  },
  {
    id: PROGRESS_RECORD_IDS[2],
    roadmap_item_id: ROADMAP_ITEM_IDS[1],
    milestone_type: 'feature',
    title: 'Roadmap page wired to database',
    description: 'Roadmap page reads from the roadmap_items table. Sample content.',
    status: 'completed',
    weight: 2,
  },
  {
    id: PROGRESS_RECORD_IDS[3],
    roadmap_item_id: ROADMAP_ITEM_IDS[2],
    milestone_type: 'feature',
    title: 'Progress dashboard visualization',
    description: 'Progress dashboard visualizes milestone completion. Sample content.',
    status: 'planned',
    weight: 3,
  },
  {
    id: PROGRESS_RECORD_IDS[4],
    roadmap_item_id: ROADMAP_ITEM_IDS[2],
    milestone_type: 'improvement',
    title: 'Progress calculation logic',
    description: 'Transparent progress calculation using milestone weights. Sample content.',
    status: 'planned',
    weight: 2,
  },
  {
    id: PROGRESS_RECORD_IDS[5],
    roadmap_item_id: ROADMAP_ITEM_IDS[3],
    milestone_type: 'feature',
    title: 'Changelog page wired to database',
    description: 'Changelog page reads from the changelog_entries table. Sample content.',
    status: 'planned',
    weight: 2,
  },
];

const CHANGELOG_SEED: ChangelogSeedEntry[] = [
  {
    version: CHANGELOG_VERSIONS[0],
    summary: 'Public pages connected to Supabase sample records.',
    body: 'This release connects the public roadmap, progress, and changelog pages to Supabase sample records. The content is sample content only.',
    features: ['Roadmap page reads live roadmap items.'],
    improvements: ['Progress page calculates completion from milestones.'],
    fixes: [],
    limitations: ['Content is sample content.'],
  },
  {
    version: CHANGELOG_VERSIONS[1],
    summary: 'Public project foundation deployed.',
    body: 'The initial public project foundation is deployed with a Supabase-backed schema and demo-mode fallback.',
    features: ['Public pages with demo-mode fallback.'],
    improvements: [],
    fixes: [],
    limitations: ['No authentication yet.'],
  },
];

export interface SeedResult {
  roadmaps_upserted: number;
  progress_upserted: number;
  changelog_upserted: number;
  config_checked: boolean;
  demo_mode: boolean;
  error?: string;
}

/**
 * Seeds public sample records using stable identifiers and upserts, so
 * re-running the seed never creates duplicates. It does NOT create signups,
 * private user data, or claims that planned features are completed.
 */
export async function runSeed(config: SeedConfig): Promise<SeedResult> {
  const client = makeClient(config);
  const now = new Date().toISOString();

  const { error: roadmapError } = await client.from('roadmap_items').upsert(
    ROADMAP_SEED.map((item) => ({
      ...item,
      effort_estimate: null,
      target_quarter: null,
      contributor_id: null,
      created_at: now,
      updated_at: now,
      published_at: now,
    })),
    { onConflict: 'id' },
  );

  if (roadmapError) {
    return {
      roadmaps_upserted: 0,
      progress_upserted: 0,
      changelog_upserted: 0,
      config_checked: true,
      demo_mode: false,
      error: 'Failed to seed roadmap_items: ' + roadmapError.message,
    };
  }

  const { error: progressError } = await client.from('progress_records').upsert(
    PROGRESS_SEED.map((record) => ({
      ...record,
      completed_at: record.status === 'completed' || record.status === 'verified' ? now : null,
      verified_at: record.status === 'verified' ? now : null,
      verified_by: null,
      link: null,
      created_at: now,
      updated_at: now,
    })),
    { onConflict: 'id' },
  );

  if (progressError) {
    return {
      roadmaps_upserted: ROADMAP_SEED.length,
      progress_upserted: 0,
      changelog_upserted: 0,
      config_checked: true,
      demo_mode: false,
      error: 'Failed to seed progress_records: ' + progressError.message,
    };
  }

  const { error: changelogError } = await client.from('changelog_entries').upsert(
    CHANGELOG_SEED.map((entry) => ({
      ...entry,
      published_at: now,
      created_at: now,
      updated_at: now,
    })),
    { onConflict: 'version' },
  );

  if (changelogError) {
    return {
      roadmaps_upserted: ROADMAP_SEED.length,
      progress_upserted: PROGRESS_SEED.length,
      changelog_upserted: 0,
      config_checked: true,
      demo_mode: false,
      error: 'Failed to seed changelog_entries: ' + changelogError.message,
    };
  }

  return {
    roadmaps_upserted: ROADMAP_SEED.length,
    progress_upserted: PROGRESS_SEED.length,
    changelog_upserted: CHANGELOG_SEED.length,
    config_checked: true,
    demo_mode: false,
  };
}

export async function runSeedDemo(): Promise<SeedResult> {
  return {
    roadmaps_upserted: 0,
    progress_upserted: 0,
    changelog_upserted: 0,
    config_checked: false,
    demo_mode: true,
  };
}
