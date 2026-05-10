-- =====================================================================
-- Sad Boi Clique FC — Auth schema
-- =====================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run: every CREATE uses `IF NOT EXISTS` (or REPLACE for fns).
--
-- Adds:
--   * `profiles`      — one row per signed-up user, with display name +
--                       admin flag + per-user Tweaks panel preferences.
--   * `invite_codes`  — invite-only sign-up. New users must supply a
--                       valid, unused code at sign-up time. Codes are
--                       consumed atomically inside a trigger so a code
--                       can't be reused even under heavy concurrency.
--   * Trigger         — auto-creates a profile when a user signs up,
--                       AND rejects sign-up if the invite code is
--                       missing/invalid/already used.
--   * RPC             — `is_invite_code_valid(code)` for the front-end
--                       to give early "good code" feedback before the
--                       sign-up form is submitted.
-- =====================================================================

-- ── 1. PROFILES ──────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid         primary key references auth.users(id) on delete cascade,
  display_name  text         not null,
  avatar_url    text,
  is_admin      boolean      not null default false,
  tweaks        jsonb,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now()
);

create index if not exists profiles_display_name_idx
  on public.profiles (lower(display_name));

-- Auto-bump updated_at on any UPDATE so we can reason about freshness.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ── 2. INVITE CODES ──────────────────────────────────────────────────
-- One row per code. Code is the primary key (free-form text — could be
-- "ABC123", "shmuelly-2026", whatever).
create table if not exists public.invite_codes (
  code         text         primary key,
  created_by   uuid         references public.profiles(id),
  created_at   timestamptz  not null default now(),
  expires_at   timestamptz,
  used_at      timestamptz,
  used_by      uuid         references public.profiles(id),
  notes        text
);


-- ── 3. SIGN-UP TRIGGER ───────────────────────────────────────────────
-- Runs INSIDE the auth.users insert transaction. Validates + consumes
-- the invite code. If invalid, raises an exception which causes the
-- sign-up itself to fail, so we never end up with orphan auth.users
-- rows that don't have a profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_invite_code  text;
  v_consumed     int;
begin
  -- These are passed from the front end via supabase.auth.signUp({
  --   options: { data: { display_name: '...', invite_code: '...' } } })
  v_display_name := nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), '');
  v_invite_code  := nullif(trim(coalesce(new.raw_user_meta_data->>'invite_code',  '')), '');

  if v_display_name is null then
    raise exception 'Display name is required';
  end if;

  if v_invite_code is null then
    raise exception 'Invite code is required';
  end if;

  -- Atomically consume: only succeeds if the code exists, hasn't been
  -- used, and (if expiry set) hasn't expired.
  update public.invite_codes
  set used_at = now(), used_by = new.id
  where code = v_invite_code
    and used_at is null
    and (expires_at is null or expires_at > now());

  get diagnostics v_consumed = row_count;
  if v_consumed = 0 then
    raise exception 'Invalid or already-used invite code';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ── 4. PUBLIC RPC: code-validation preview ───────────────────────────
-- Lets the sign-up form give "yep that's a valid code" feedback BEFORE
-- the user submits. SECURITY DEFINER so anonymous callers can validate
-- without being granted SELECT on invite_codes.
create or replace function public.is_invite_code_valid(code_input text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_found public.invite_codes;
begin
  select * into v_found
  from public.invite_codes
  where code = code_input
    and used_at is null
    and (expires_at is null or expires_at > now())
  limit 1;
  return v_found.code is not null;
end;
$$;

grant execute on function public.is_invite_code_valid(text) to anon, authenticated;


-- ── 5. ROW LEVEL SECURITY ────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.invite_codes  enable row level security;

-- Profiles: anyone can read (so admin author names render publicly);
-- a user can only update their own row.
drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

drop policy if exists "Users update only their own profile" on public.profiles;
create policy "Users update only their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Invite codes: only admins can manage. Anonymous validation goes
-- through the SECURITY DEFINER RPC above, not through SELECT.
drop policy if exists "Admins read invite codes"   on public.invite_codes;
drop policy if exists "Admins insert invite codes" on public.invite_codes;
drop policy if exists "Admins update invite codes" on public.invite_codes;
drop policy if exists "Admins delete invite codes" on public.invite_codes;

create policy "Admins read invite codes"
  on public.invite_codes for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins insert invite codes"
  on public.invite_codes for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update invite codes"
  on public.invite_codes for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins delete invite codes"
  on public.invite_codes for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
