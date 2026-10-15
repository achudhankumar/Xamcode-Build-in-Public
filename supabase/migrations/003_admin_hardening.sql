-- 003_admin_hardening.sql
-- Admin dashboard support + privilege-escalation fixes found during review.
-- Apply with `npx supabase db push` after 001 and 002. Non-destructive:
-- only adds functions, triggers, and policies.

-- ------------------------------------------------------------------
-- 1. Strict admin check (admins only; moderators excluded).
--    002's is_admin() also matches 'moderator', which is too permissive
--    for private signup data and role management.
-- ------------------------------------------------------------------
create or replace function public.is_strict_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------------
-- 2. Privilege-escalation fix: the 002 policy profiles_update_own lets a
--    user update their own row, and nothing stopped them from setting
--    role = 'admin'. This trigger blocks role/id changes unless the actor
--    is already a strict admin, or there is no auth context at all
--    (service-role key / direct SQL — used for bootstrap and admin tooling).
-- ------------------------------------------------------------------
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;
  if new.role is distinct from old.role
     and not public.is_strict_admin()
     and auth.uid() is not null then
    raise exception 'only administrators can change roles';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_profile_privileges on public.profiles;
create trigger trg_protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ------------------------------------------------------------------
-- 3. Moderation-flag integrity: authors may edit their own discussions,
--    but must not be able to pin/lock them themselves.
-- ------------------------------------------------------------------
create or replace function public.protect_discussion_moderation_flags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (new.is_pinned is distinct from old.is_pinned
      or new.is_locked is distinct from old.is_locked)
     and not public.is_moderator_or_above() then
    raise exception 'only moderators can change pin/lock state';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_discussion_flags on public.discussions;
create trigger trg_protect_discussion_flags
  before update on public.discussions
  for each row execute function public.protect_discussion_moderation_flags();

-- ------------------------------------------------------------------
-- 4. Suggestion-status integrity: authors may edit their own suggestion
--    text, but only moderators may move its status.
-- ------------------------------------------------------------------
create or replace function public.protect_suggestion_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and not public.is_moderator_or_above() then
    raise exception 'only moderators can change suggestion status';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_suggestion_status on public.suggestions;
create trigger trg_protect_suggestion_status
  before update on public.suggestions
  for each row execute function public.protect_suggestion_status();

-- ------------------------------------------------------------------
-- 5. Admin write policies for public content tables. 001 only granted
--    public SELECT; without these, admins cannot manage content through
--    their own session at all (FORCE RLS applies to everyone).
-- ------------------------------------------------------------------
create policy roadmap_items_admin_insert on public.roadmap_items
  for insert with check (public.is_strict_admin());

create policy roadmap_items_admin_update on public.roadmap_items
  for update using (public.is_strict_admin()) with check (public.is_strict_admin());

create policy roadmap_items_admin_delete on public.roadmap_items
  for delete using (public.is_strict_admin());

create policy progress_records_admin_insert on public.progress_records
  for insert with check (public.is_strict_admin());

create policy progress_records_admin_update on public.progress_records
  for update using (public.is_strict_admin()) with check (public.is_strict_admin());

create policy progress_records_admin_delete on public.progress_records
  for delete using (public.is_strict_admin());

create policy changelog_entries_admin_insert on public.changelog_entries
  for insert with check (public.is_strict_admin());

create policy changelog_entries_admin_update on public.changelog_entries
  for update using (public.is_strict_admin()) with check (public.is_strict_admin());

create policy changelog_entries_admin_delete on public.changelog_entries
  for delete using (public.is_strict_admin());

-- ------------------------------------------------------------------
-- 6. Private waitlist: readable by strict admins only (001 kept SELECT
--    closed to everyone else; policies OR together).
-- ------------------------------------------------------------------
create policy early_access_signups_admin_read on public.early_access_signups
  for select using (public.is_strict_admin());

-- Admins may update signup status (confirmed/unsubscribed) — no public write.
create policy early_access_signups_admin_update on public.early_access_signups
  for update using (public.is_strict_admin()) with check (public.is_strict_admin());

-- ------------------------------------------------------------------
-- 7. Role management: strict admins can update profiles (e.g. promote a
--    moderator) through their session. The 002 self-update policy still
--    applies to everyone, and the trigger in section 2 still blocks
--    non-admin role changes, so self-elevation stays impossible.
-- ------------------------------------------------------------------
create policy profiles_admin_update on public.profiles
  for update using (public.is_strict_admin()) with check (public.is_strict_admin());
