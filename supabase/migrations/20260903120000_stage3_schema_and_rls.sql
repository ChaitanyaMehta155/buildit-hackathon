-- =====================================================================
-- BuildIt Hackathon — STAGE 3
-- Database schema + Row Level Security
-- =====================================================================
-- Tables:  profiles, teams, team_members, projects
--
-- Invariants enforced by the database (not by the client):
--   * Only authenticated users can read or write anything. `anon` has no
--     privileges on any table in this migration.
--   * A participant can belong to at most one team.
--   * A team has between 1 and 4 members.
--   * A team has exactly one leader.
--   * A team has at most one project.
--   * teams.track_id must be one of the four BuildIt track slugs.
--
-- This migration is idempotent and can be re-run safely.
-- It performs NO destructive DROP TABLE / TRUNCATE.
-- =====================================================================

begin;

-- =====================================================================
-- 0. SHARED HELPERS
-- =====================================================================

-- Keeps updated_at honest regardless of what the client sends.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Generic guard used to freeze structural columns (ownership, team links).
-- Column names are passed as trigger arguments.
create or replace function public.prevent_immutable_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_col text;
begin
  foreach v_col in array tg_argv loop
    if (to_jsonb(new) ->> v_col) is distinct from (to_jsonb(old) ->> v_col) then
      raise exception 'Column %.% cannot be changed after creation.', tg_table_name, v_col
        using errcode = '42501';
    end if;
  end loop;
  return new;
end;
$$;


-- =====================================================================
-- 1. TABLES
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1.1 profiles — one row per Supabase auth user
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text        not null,
  college     text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_full_name_not_blank check (length(btrim(full_name)) between 1 and 120),
  constraint profiles_email_format check (
    email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint profiles_phone_format check (
    phone is null or phone = '' or length(regexp_replace(phone, '[^0-9]', '', 'g')) between 10 and 15
  )
);

comment on table public.profiles is
  'Public participant profile. 1:1 with auth.users, created automatically by handle_new_user().';

-- ---------------------------------------------------------------------
-- 1.2 teams
-- ---------------------------------------------------------------------
create table if not exists public.teams (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  track_id    text        not null,
  invite_code text        not null,
  created_by  uuid        references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint teams_name_length check (length(btrim(name)) between 2 and 60),

  -- Valid track IDs: must match the slugs hard-coded in the React frontend
  -- (src/pages/Register.jsx and src/pages/Tracks.jsx).
  constraint teams_track_id_valid check (
    track_id in ('ai-ml', 'web3-infra', 'climate-sustainability', 'open-innovation')
  ),

  constraint teams_invite_code_format check (invite_code ~ '^[A-Z0-9]{8}$')
);

-- Team names are unique case-insensitively ("ByteCraft" == "bytecraft").
create unique index if not exists teams_name_lower_key
  on public.teams (lower(btrim(name)));

create unique index if not exists teams_invite_code_key
  on public.teams (invite_code);

create index if not exists teams_track_id_idx on public.teams (track_id);

comment on table public.teams is
  'A registered BuildIt team. The leader row in team_members is created automatically on insert.';

-- ---------------------------------------------------------------------
-- 1.3 team_members — roster join table
-- ---------------------------------------------------------------------
create table if not exists public.team_members (
  id         uuid        primary key default gen_random_uuid(),
  team_id    uuid        not null references public.teams (id)    on delete cascade,
  profile_id uuid        not null references public.profiles (id) on delete cascade,
  role       text        not null default 'member',
  joined_at  timestamptz not null default now(),

  constraint team_members_role_valid check (role in ('leader', 'member')),

  -- HARD RULE: one participant cannot belong to multiple teams.
  -- profile_id is globally unique, not unique-per-team.
  constraint team_members_profile_id_key unique (profile_id)
);

-- HARD RULE: at most one leader per team, enforced at every instant.
-- ("At least one" is enforced by the deferred composition constraint below.)
create unique index if not exists team_members_one_leader_per_team
  on public.team_members (team_id)
  where role = 'leader';

create index if not exists team_members_team_id_idx on public.team_members (team_id);

comment on table public.team_members is
  'Team roster. UNIQUE(profile_id) enforces one-team-per-participant; rows are inserted via SECURITY DEFINER functions only.';

-- ---------------------------------------------------------------------
-- 1.4 projects — one submission per team
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id           uuid        primary key default gen_random_uuid(),
  team_id      uuid        not null references public.teams (id) on delete cascade,
  name         text        not null,
  description  text,
  repo_url     text,
  demo_url     text,
  status       text        not null default 'draft',
  submitted_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- HARD RULE: one project per team.
  constraint projects_team_id_key unique (team_id),

  constraint projects_name_length check (length(btrim(name)) between 2 and 120),
  constraint projects_description_length check (
    description is null or length(description) <= 2000
  ),
  constraint projects_status_valid check (status in ('draft', 'submitted')),
  constraint projects_repo_url_format check (
    repo_url is null or repo_url = '' or repo_url ~* '^https?://[^[:space:]]+$'
  ),
  constraint projects_demo_url_format check (
    demo_url is null or demo_url = '' or demo_url ~* '^https?://[^[:space:]]+$'
  ),
  -- A submitted project must carry a submission timestamp and a repository.
  constraint projects_submission_complete check (
    status <> 'submitted'
    or (submitted_at is not null and repo_url is not null and repo_url <> '')
  )
);

comment on table public.projects is
  'Hackathon submission. UNIQUE(team_id) enforces exactly one project per team.';


-- =====================================================================
-- 2. AUTHORISATION HELPERS
-- =====================================================================
-- All helpers are SECURITY DEFINER so they read team_members WITHOUT
-- re-entering RLS. This is what prevents infinite policy recursion
-- (team_members policies referencing team_members).
-- They are STABLE and read-only, so they cannot be abused to write data.

-- The single team the caller belongs to, or NULL.
create or replace function public.current_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select tm.team_id
  from public.team_members tm
  where tm.profile_id = (select auth.uid())
  limit 1;
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.profile_id = (select auth.uid())
  );
$$;

create or replace function public.is_team_leader(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.profile_id = (select auth.uid())
      and tm.role = 'leader'
  );
$$;

-- True when p_profile_id sits on the caller's team (or is the caller).
create or replace function public.is_teammate(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_profile_id = (select auth.uid())
     or exists (
       select 1
       from public.team_members tm
       where tm.profile_id = p_profile_id
         and tm.team_id = public.current_team_id()
     );
$$;


-- =====================================================================
-- 3. PROFILE CREATION TRIGGER (auth.users -> public.profiles)
-- =====================================================================
-- Reads the metadata that AuthContext.signUp() sends:
--   { full_name, college, phone }

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, college, phone)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'BuildIt Participant'
    ),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'college', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Keep the cached email in sync when a user changes their login email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles p
     set email = new.email,
         updated_at = now()
   where p.id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- Backfill profiles for accounts created during Stage 2 auth testing.
insert into public.profiles (id, email, full_name, college, phone)
select
  u.id,
  u.email,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'BuildIt Participant'
  ),
  nullif(btrim(coalesce(u.raw_user_meta_data ->> 'college', '')), ''),
  nullif(btrim(coalesce(u.raw_user_meta_data ->> 'phone', '')), '')
from auth.users u
on conflict (id) do nothing;


-- =====================================================================
-- 4. TEAM COMPOSITION INTEGRITY
-- =====================================================================

-- 4.1 Creating a team automatically seats the creator as its leader.
--     This is what makes "exactly one leader" true from the very first
--     moment a team exists. If the creator is already on a team, the
--     UNIQUE(profile_id) constraint aborts the whole transaction.
create or replace function public.handle_new_team()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.created_by is null then
    raise exception 'A team must record the profile that created it.'
      using errcode = '23502';
  end if;

  insert into public.team_members (team_id, profile_id, role)
  values (new.id, new.created_by, 'leader');

  return new;
end;
$$;

drop trigger if exists trg_teams_seed_leader on public.teams;
create trigger trg_teams_seed_leader
  after insert on public.teams
  for each row
  execute function public.handle_new_team();

-- 4.2 Give every team a random join code if the client did not set one.
create or replace function public.assign_invite_code()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text;
begin
  if new.invite_code is not null and btrim(new.invite_code) <> '' then
    new.invite_code := upper(btrim(new.invite_code));
    return new;
  end if;

  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.teams t where t.invite_code = v_code);
  end loop;

  new.invite_code := v_code;
  return new;
end;
$$;

alter table public.teams alter column invite_code drop not null;

drop trigger if exists trg_teams_invite_code on public.teams;
create trigger trg_teams_invite_code
  before insert on public.teams
  for each row
  execute function public.assign_invite_code();

-- Re-assert NOT NULL: the BEFORE trigger always fills the column.
alter table public.teams alter column invite_code set not null;

-- 4.3 Repair the roster after a member disappears (account deleted,
--     member removed, member left). Runs immediately, before the
--     deferred composition check below is evaluated.
create or replace function public.handle_member_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_remaining int;
begin
  -- If the parent team is already gone (ON DELETE CASCADE), nothing to do.
  if not exists (select 1 from public.teams t where t.id = old.team_id) then
    return null;
  end if;

  select count(*) into v_remaining
  from public.team_members tm
  where tm.team_id = old.team_id;

  -- Last member left: the team no longer exists in any meaningful sense.
  if v_remaining = 0 then
    delete from public.teams t where t.id = old.team_id;
    return null;
  end if;

  -- The leader is gone but members remain: promote the longest-standing one.
  if not exists (
    select 1 from public.team_members tm
    where tm.team_id = old.team_id and tm.role = 'leader'
  ) then
    update public.team_members tm
       set role = 'leader'
     where tm.id = (
       select tm2.id
       from public.team_members tm2
       where tm2.team_id = old.team_id
       order by tm2.joined_at asc, tm2.id asc
       limit 1
     );
  end if;

  return null;
end;
$$;

drop trigger if exists trg_team_members_after_delete on public.team_members;
create trigger trg_team_members_after_delete
  after delete on public.team_members
  for each row
  execute function public.handle_member_removed();

-- 4.4 THE composition invariant, checked once per transaction at COMMIT.
--     Deferring it lets a leadership transfer demote-then-promote inside
--     one transaction without ever tripping a mid-statement violation.
--     The FOR UPDATE lock on the team row serialises concurrent joins so
--     two simultaneous 4th members cannot both slip through.
create or replace function public.enforce_team_composition()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_team_id uuid;
  v_members int;
  v_leaders int;
begin
  if tg_op = 'DELETE' then
    v_team_id := old.team_id;
  else
    v_team_id := new.team_id;
  end if;

  perform 1 from public.teams t where t.id = v_team_id for update;
  if not found then
    -- Team was deleted in this same transaction; nothing to validate.
    return null;
  end if;

  select count(*), count(*) filter (where tm.role = 'leader')
    into v_members, v_leaders
  from public.team_members tm
  where tm.team_id = v_team_id;

  if v_members > 4 then
    raise exception 'Team % has % members but the maximum team size is 4.',
      v_team_id, v_members using errcode = '23514';
  end if;

  if v_members < 1 then
    raise exception 'Team % must keep at least one member.',
      v_team_id using errcode = '23514';
  end if;

  if v_leaders <> 1 then
    raise exception 'Team % must have exactly one leader (found %).',
      v_team_id, v_leaders using errcode = '23514';
  end if;

  return null;
end;
$$;

drop trigger if exists trg_team_members_composition on public.team_members;
create constraint trigger trg_team_members_composition
  after insert or update or delete on public.team_members
  deferrable initially deferred
  for each row
  execute function public.enforce_team_composition();

-- 4.5 Freeze structural columns.
drop trigger if exists trg_profiles_immutable on public.profiles;
create trigger trg_profiles_immutable
  before update on public.profiles
  for each row
  execute function public.prevent_immutable_columns('id', 'created_at');

drop trigger if exists trg_teams_immutable on public.teams;
create trigger trg_teams_immutable
  before update on public.teams
  for each row
  execute function public.prevent_immutable_columns('id', 'created_by', 'invite_code', 'created_at');

-- A member cannot be shuffled to another team, and a roster row cannot be
-- reassigned to another person. Only `role` is mutable.
drop trigger if exists trg_team_members_immutable on public.team_members;
create trigger trg_team_members_immutable
  before update on public.team_members
  for each row
  execute function public.prevent_immutable_columns('id', 'team_id', 'profile_id', 'joined_at');

drop trigger if exists trg_projects_immutable on public.projects;
create trigger trg_projects_immutable
  before update on public.projects
  for each row
  execute function public.prevent_immutable_columns('id', 'team_id', 'created_at');

-- 4.6 updated_at maintenance.
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_teams_updated_at on public.teams;
create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();


-- =====================================================================
-- 5. RPCs — the only sanctioned way to mutate team_members
-- =====================================================================
-- team_members deliberately has NO INSERT and NO UPDATE policy. Roster
-- writes go through these two SECURITY DEFINER functions so that:
--   * nobody can insert themselves into a team they were not invited to,
--   * nobody can insert someone ELSE into a team without consent
--     (which would silently burn that person's one-team-only slot).

-- 5.1 Create a team and become its leader, atomically.
--
-- Why an RPC and not a plain INSERT: PostgreSQL evaluates the SELECT policy
-- on RETURNING rows BEFORE the AFTER INSERT trigger fires, so a client doing
-- `.insert({...}).select()` would be denied its own new row (it is not yet a
-- member of the team it just created). This function returns the finished
-- row after the leader has been seated. The teams INSERT policy below is
-- retained as defence in depth for any direct insert without RETURNING.
create or replace function public.create_team(p_name text, p_track_id text)
returns public.teams
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := (select auth.uid());
  v_team public.teams;
begin
  if v_uid is null then
    raise exception 'You must be signed in to create a team.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'Your participant profile is not ready yet. Please retry.'
      using errcode = '23503';
  end if;

  if exists (select 1 from public.team_members tm where tm.profile_id = v_uid) then
    raise exception 'You already belong to a team. Leave it before creating another.'
      using errcode = '23505';
  end if;

  insert into public.teams (name, track_id, created_by)
  values (btrim(coalesce(p_name, '')), btrim(lower(coalesce(p_track_id, ''))), v_uid)
  returning * into v_team;

  return v_team;
end;
$$;

-- 5.2 Join an existing team with its 8-character invite code.
create or replace function public.join_team_by_code(p_invite_code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_team_id uuid;
  v_count   int;
begin
  if v_uid is null then
    raise exception 'You must be signed in to join a team.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'Your participant profile is not ready yet. Please retry.'
      using errcode = '23503';
  end if;

  if exists (select 1 from public.team_members tm where tm.profile_id = v_uid) then
    raise exception 'You already belong to a team. Leave it before joining another.'
      using errcode = '23505';
  end if;

  select t.id into v_team_id
  from public.teams t
  where t.invite_code = upper(btrim(coalesce(p_invite_code, '')))
  for update;

  if v_team_id is null then
    raise exception 'That invite code does not match any team.' using errcode = 'P0002';
  end if;

  select count(*) into v_count
  from public.team_members tm
  where tm.team_id = v_team_id;

  if v_count >= 4 then
    raise exception 'That team is already full (4 members).' using errcode = '23514';
  end if;

  insert into public.team_members (team_id, profile_id, role)
  values (v_team_id, v_uid, 'member');

  return v_team_id;
end;
$$;

-- 5.3 Hand the leader role to an existing teammate.
create or replace function public.transfer_team_leadership(p_new_leader_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := (select auth.uid());
  v_team_id uuid;
begin
  if v_uid is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  select tm.team_id into v_team_id
  from public.team_members tm
  where tm.profile_id = v_uid
    and tm.role = 'leader';

  if v_team_id is null then
    raise exception 'Only the team leader can transfer leadership.' using errcode = '42501';
  end if;

  if p_new_leader_id = v_uid then
    return;
  end if;

  if not exists (
    select 1 from public.team_members tm
    where tm.team_id = v_team_id and tm.profile_id = p_new_leader_id
  ) then
    raise exception 'The new leader must already be a member of your team.'
      using errcode = '23503';
  end if;

  -- Two statements: the partial unique index never sees two leaders, and
  -- the deferred composition check sees exactly one leader at COMMIT.
  update public.team_members tm
     set role = 'member'
   where tm.team_id = v_team_id and tm.profile_id = v_uid;

  update public.team_members tm
     set role = 'leader'
   where tm.team_id = v_team_id and tm.profile_id = p_new_leader_id;
end;
$$;


-- =====================================================================
-- 6. PRIVILEGES — authenticated users only
-- =====================================================================

revoke all on public.profiles     from public, anon, authenticated;
revoke all on public.teams        from public, anon, authenticated;
revoke all on public.team_members from public, anon, authenticated;
revoke all on public.projects     from public, anon, authenticated;

-- `anon` is granted nothing at all: signed-out visitors cannot read or
-- write a single row, independent of RLS.
grant select, insert, update                 on public.profiles     to authenticated;
grant select, insert, update, delete         on public.teams        to authenticated;
grant select,                 delete         on public.team_members to authenticated;
grant select, insert, update, delete         on public.projects     to authenticated;

revoke all on function public.set_updated_at()                    from public;
revoke all on function public.prevent_immutable_columns()         from public;
revoke all on function public.handle_new_user()                   from public;
revoke all on function public.handle_user_email_change()          from public;
revoke all on function public.handle_new_team()                   from public;
revoke all on function public.assign_invite_code()                from public;
revoke all on function public.handle_member_removed()             from public;
revoke all on function public.enforce_team_composition()          from public;
revoke all on function public.current_team_id()                   from public;
revoke all on function public.is_team_member(uuid)                from public;
revoke all on function public.is_team_leader(uuid)                from public;
revoke all on function public.is_teammate(uuid)                   from public;
revoke all on function public.create_team(text, text)             from public;
revoke all on function public.join_team_by_code(text)             from public;
revoke all on function public.transfer_team_leadership(uuid)      from public;

grant execute on function public.current_team_id()              to authenticated;
grant execute on function public.is_team_member(uuid)           to authenticated;
grant execute on function public.is_team_leader(uuid)           to authenticated;
grant execute on function public.is_teammate(uuid)              to authenticated;
grant execute on function public.create_team(text, text)        to authenticated;
grant execute on function public.join_team_by_code(text)        to authenticated;
grant execute on function public.transfer_team_leadership(uuid) to authenticated;


-- =====================================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles     enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.projects     enable row level security;

-- ---------------------------------------------------------------------
-- 7.1 profiles
-- ---------------------------------------------------------------------
-- Read: yourself and your teammates only. The participant directory is
-- NOT public — a signed-in user cannot enumerate every registrant.
drop policy if exists "profiles_select_self_or_teammate" on public.profiles;
create policy "profiles_select_self_or_teammate"
  on public.profiles
  for select
  to authenticated
  using (public.is_teammate(id));

-- Insert is normally done by handle_new_user(). This policy exists only as
-- a self-heal path and can never create a profile for somebody else.
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  to authenticated
  with check (id = (select auth.uid()));

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No DELETE policy: profiles disappear only when auth.users does (cascade).

-- ---------------------------------------------------------------------
-- 7.2 teams
-- ---------------------------------------------------------------------
-- Read: your own team only. Discovery happens via invite code, so there is
-- no reason to expose the full team list (or other teams' invite codes).
drop policy if exists "teams_select_own" on public.teams;
create policy "teams_select_own"
  on public.teams
  for select
  to authenticated
  using (public.is_team_member(id));

-- Create: only for yourself, and only if you are not already on a team.
-- The AFTER INSERT trigger then seats you as the leader.
drop policy if exists "teams_insert_own" on public.teams;
create policy "teams_insert_own"
  on public.teams
  for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and public.current_team_id() is null
  );

drop policy if exists "teams_update_leader" on public.teams;
create policy "teams_update_leader"
  on public.teams
  for update
  to authenticated
  using (public.is_team_leader(id))
  with check (public.is_team_leader(id));

drop policy if exists "teams_delete_leader" on public.teams;
create policy "teams_delete_leader"
  on public.teams
  for delete
  to authenticated
  using (public.is_team_leader(id));

-- ---------------------------------------------------------------------
-- 7.3 team_members
-- ---------------------------------------------------------------------
-- Read: the roster of your own team.
drop policy if exists "team_members_select_own_team" on public.team_members;
create policy "team_members_select_own_team"
  on public.team_members
  for select
  to authenticated
  using (team_id = public.current_team_id());

-- NO insert policy  -> joining is only possible via join_team_by_code().
-- NO update policy  -> role changes only via transfer_team_leadership().

-- Delete: a member may leave; a leader may remove any non-leader.
-- The leader can never delete their own row — they must transfer
-- leadership first, or delete the whole team.
drop policy if exists "team_members_delete_self_or_by_leader" on public.team_members;
create policy "team_members_delete_self_or_by_leader"
  on public.team_members
  for delete
  to authenticated
  using (
    team_id = public.current_team_id()
    and role <> 'leader'
    and (
      profile_id = (select auth.uid())
      or public.is_team_leader(team_id)
    )
  );

-- ---------------------------------------------------------------------
-- 7.4 projects
-- ---------------------------------------------------------------------
-- Any member of the team may read and edit the submission; only the
-- leader may delete it. Nothing is visible across teams.
drop policy if exists "projects_select_own_team" on public.projects;
create policy "projects_select_own_team"
  on public.projects
  for select
  to authenticated
  using (team_id = public.current_team_id());

drop policy if exists "projects_insert_own_team" on public.projects;
create policy "projects_insert_own_team"
  on public.projects
  for insert
  to authenticated
  with check (team_id = public.current_team_id());

drop policy if exists "projects_update_own_team" on public.projects;
create policy "projects_update_own_team"
  on public.projects
  for update
  to authenticated
  using (team_id = public.current_team_id())
  with check (team_id = public.current_team_id());

drop policy if exists "projects_delete_leader" on public.projects;
create policy "projects_delete_leader"
  on public.projects
  for delete
  to authenticated
  using (public.is_team_leader(team_id));

commit;

-- =====================================================================
-- END OF STAGE 3 MIGRATION
-- =====================================================================
