-- 002_community_auth.sql
-- Adds profiles + roles, community discussions/replies, suggestions + votes.
-- Preserves all existing tables from 001. Apply with `npx supabase db push`.
-- Requires Supabase Auth (auth.users) to exist.

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('member', 'moderator', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  role public.app_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  username_length int generated always as (length(username)) stored
);

-- Only constrain username length when a username is provided.
alter table public.profiles
  add constraint profiles_username_len_check
  check (username is null or (length(username) >= 3 and length(username) <= 30));

-- Auto-create a profile row when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security definer helper: is the current user an admin/moderator?
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

create or replace function public.is_moderator_or_above()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

-- ---------------------------------------------------------------------------
-- Community discussions + replies
-- ---------------------------------------------------------------------------
create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(title) between 3 and 150),
  body text not null check (length(body) between 1 and 10000),
  category text not null default 'general'
    check (category in ('general', 'feedback', 'help', 'showcase', 'announcements')),
  is_locked boolean not null default false,
  is_pinned boolean not null default false,
  reply_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.discussion_replies (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index discussions_created_at_idx on public.discussions (created_at desc);
create index discussions_category_idx on public.discussions (category);
create index discussion_replies_discussion_idx on public.discussion_replies (discussion_id, created_at);

-- ---------------------------------------------------------------------------
-- Suggestions + votes
-- ---------------------------------------------------------------------------
create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(title) between 3 and 150),
  body text not null check (length(body) between 1 and 5000),
  status text not null default 'open'
    check (status in ('open', 'under_review', 'planned', 'in_progress', 'completed', 'declined')),
  vote_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Prevent duplicate votes from the same user on the same suggestion.
  unique (suggestion_id, user_id)
);

create index suggestions_created_at_idx on public.suggestions (created_at desc);
create index suggestions_status_idx on public.suggestions (status);
create index suggestion_votes_suggestion_idx on public.suggestion_votes (suggestion_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;

-- Profiles: public read; users update only their OWN row, and only non-role
-- columns. There is NO policy that lets a user set role, so self-elevation to
-- admin is impossible from the client. Role changes must go through the
-- service-role key (admin tooling) only.
create policy profiles_public_read on public.profiles
  for select using (true);

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Discussions: public read; only authenticated authors insert their own rows.
-- Authors or moderators can update/delete. Locked discussions reject inserts.
create policy discussions_public_read on public.discussions
  for select using (true);

create policy discussions_insert_own on public.discussions
  for insert with check (auth.uid() = author_id);

create policy discussions_update_author_or_mod on public.discussions
  for update using (auth.uid() = author_id or public.is_moderator_or_above());

create policy discussions_delete_author_or_mod on public.discussions
  for delete using (auth.uid() = author_id or public.is_moderator_or_above());

-- Discussion replies: public read; authenticated authors insert their own.
create policy discussion_replies_public_read on public.discussion_replies
  for select using (true);

create policy discussion_replies_insert_own on public.discussion_replies
  for insert
  with check (
    auth.uid() = author_id
    and not (select is_locked from public.discussions where id = discussion_id)
  );

create policy discussion_replies_delete_author_or_mod on public.discussion_replies
  for delete using (auth.uid() = author_id or public.is_moderator_or_above());

-- Suggestions: public read; authenticated authors insert their own.
create policy suggestions_public_read on public.suggestions
  for select using (true);

create policy suggestions_insert_own on public.suggestions
  for insert with check (auth.uid() = author_id);

create policy suggestions_update_author_or_mod on public.suggestions
  for update using (auth.uid() = author_id or public.is_moderator_or_above());

create policy suggestions_delete_author_or_mod on public.suggestions
  for delete using (auth.uid() = author_id or public.is_moderator_or_above());

-- Suggestion votes: public read; a user inserts/deletes only their OWN vote.
-- The unique(suggestion_id, user_id) constraint prevents duplicate votes.
create policy suggestion_votes_public_read on public.suggestion_votes
  for select using (true);

create policy suggestion_votes_insert_own on public.suggestion_votes
  for insert with check (auth.uid() = user_id);

create policy suggestion_votes_delete_own on public.suggestion_votes
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Denormalized count maintenance (authoritative counts, race-safe)
-- ---------------------------------------------------------------------------
create or replace function public.bump_discussion_reply_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.discussions set reply_count = reply_count + 1 where id = new.discussion_id;
  elsif (tg_op = 'DELETE') then
    update public.discussions set reply_count = greatest(reply_count - 1, 0) where id = old.discussion_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_discussion_reply_count on public.discussion_replies;
create trigger trg_discussion_reply_count
  after insert or delete on public.discussion_replies
  for each row execute function public.bump_discussion_reply_count();

-- Recompute vote_count from the votes table so it can never drift.
create or replace function public.recompute_suggestion_vote_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  target uuid;
begin
  target := coalesce(new.suggestion_id, old.suggestion_id);
  update public.suggestions s
  set vote_count = (select count(*) from public.suggestion_votes v where v.suggestion_id = target)
  where s.id = target;
  return null;
end; $$;

drop trigger if exists trg_suggestion_vote_count on public.suggestion_votes;
create trigger trg_suggestion_vote_count
  after insert or delete on public.suggestion_votes
  for each row execute function public.recompute_suggestion_vote_count();

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_discussions_touch on public.discussions;
create trigger trg_discussions_touch before update on public.discussions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_discussion_replies_touch on public.discussion_replies;
create trigger trg_discussion_replies_touch before update on public.discussion_replies
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_suggestions_touch on public.suggestions;
create trigger trg_suggestions_touch before update on public.suggestions
  for each row execute function public.touch_updated_at();
