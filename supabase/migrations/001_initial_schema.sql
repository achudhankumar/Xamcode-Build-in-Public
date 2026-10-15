-- 001_initial_schema.sql
-- Xamcode Build in Public - public data and private waitlist schema.
-- Apply this once via `npx supabase db push` after linking your project.
-- Do not edit an already-applied migration; create a new migration for later changes.

-- Public roadmap items
CREATE TABLE roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL CHECK (status IN (
    'planned', 'in_progress', 'completed', 'released', 'on_hold'
  )),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category text NOT NULL,
  effort_estimate text,
  target_quarter text,
  verification_notes text,
  is_verified_completed boolean NOT NULL DEFAULT false,
  contributor_id uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- Individual progress milestones linked to roadmap items
CREATE TABLE progress_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  milestone_type text NOT NULL CHECK (milestone_type IN (
    'feature', 'improvement', 'fix', 'verification', 'release'
  )),
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN (
    'planned', 'in_progress', 'completed', 'verified'
  )),
  weight numeric NOT NULL CHECK (weight BETWEEN 0 AND 100),
  completed_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  link text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Versioned changelog entries
CREATE TABLE changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  published_at timestamptz NOT NULL DEFAULT now(),
  summary text NOT NULL,
  body text,
  features jsonb,
  improvements jsonb,
  fixes jsonb,
  limitations jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Private early-access waitlist signups
CREATE TABLE early_access_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  interest text CHECK (interest IN (
    'general', 'features', 'testing', 'documentation', 'other'
  )),
  opted_in_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'unsubscribed', 'bounced'
  )),
  confirmation_token text UNIQUE,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: keep the public tables readable but do not expose signup emails
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_items FORCE ROW LEVEL SECURITY;

ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records FORCE ROW LEVEL SECURITY;

ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_signups FORCE ROW LEVEL SECURITY;

-- Public read for roadmap, progress, and changelog
CREATE POLICY roadmap_items_public_read ON roadmap_items
  FOR SELECT USING (true);

CREATE POLICY progress_records_public_read ON progress_records
  FOR SELECT USING (true);

CREATE POLICY changelog_entries_public_read ON changelog_entries
  FOR SELECT USING (true);

-- Public inserts are allowed only for waitlist signups via server-side helpers
CREATE POLICY early_access_signups_public_insert ON early_access_signups
  FOR INSERT WITH CHECK (true);

-- No public read access to signups
CREATE POLICY early_access_signups_no_public_select ON early_access_signups
  FOR SELECT USING (false);

-- Service role can manage everything
ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Basic indexes for common read patterns
CREATE INDEX roadmap_items_status ON roadmap_items(status);
CREATE INDEX roadmap_items_category ON roadmap_items(category);
CREATE INDEX roadmap_items_priority ON roadmap_items(priority);
CREATE INDEX roadmap_items_published_at ON roadmap_items(published_at);

CREATE INDEX progress_records_roadmap_item_id ON progress_records(roadmap_item_id);
CREATE INDEX progress_records_status ON progress_records(status);
CREATE INDEX progress_records_verified_at ON progress_records(verified_at);

CREATE INDEX changelog_entries_published_at ON changelog_entries(published_at);

CREATE INDEX early_access_signups_email ON early_access_signups(email);
CREATE INDEX early_access_signups_status ON early_access_signups(status);
