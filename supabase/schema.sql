-- =====================================================================
-- Sad Boi Clique FC — Supabase schema
-- =====================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
--
-- Design choices:
-- * Each table has a `data` JSONB column holding EA's raw response payload.
--   This lets us add new fields to the front-end later without re-running
--   migrations whenever EA tweaks their JSON.
-- * Frequently-used fields are also stored as their own columns so we can
--   index/filter on them efficiently.
-- * RLS (Row Level Security): anon (public) users can READ; only the
--   service-role key (held server-side, in the scraper) can WRITE.
-- =====================================================================

-- ── 1. CLUB STATE ────────────────────────────────────────────────────
-- One row per club (we only have one — Sad Boi Clique FC, id 477926).
-- Updated by the scraper on each successful run.
create table if not exists public.club_state (
  club_id      text         not null,
  platform     text         not null,
  data         jsonb        not null,
  fetched_at   timestamptz  not null default now(),
  primary key (club_id, platform)
);

-- ── 2. MEMBER STATE ──────────────────────────────────────────────────
-- One row per member of the club. Identified by club_id + name (EA Pro
-- Clubs API exposes the in-game name for each member, which is stable
-- enough as a key for our purposes).
create table if not exists public.member_state (
  club_id      text         not null,
  platform     text         not null,
  name         text         not null,
  data         jsonb        not null,
  fetched_at   timestamptz  not null default now(),
  primary key (club_id, platform, name)
);

create index if not exists member_state_fetched_at_idx
  on public.member_state (fetched_at desc);

-- ── 3. MATCH STATE ───────────────────────────────────────────────────
-- One row per played match. EA assigns a stable matchId so this is
-- naturally idempotent.
create table if not exists public.match_state (
  match_id     text         primary key,
  club_id      text         not null,
  platform     text         not null,
  played_at    timestamptz,
  match_type   text,
  data         jsonb        not null,
  fetched_at   timestamptz  not null default now()
);

create index if not exists match_state_played_at_idx
  on public.match_state (played_at desc nulls last);
create index if not exists match_state_club_idx
  on public.match_state (club_id, platform, played_at desc nulls last);

-- ── 4. SCRAPE LOG ────────────────────────────────────────────────────
-- One row per scraper run. Used for "last updated" displays and for
-- spotting failed runs.
create table if not exists public.scrape_log (
  id           bigserial    primary key,
  ran_at       timestamptz  not null default now(),
  ok           boolean      not null,
  error        text,
  duration_ms  integer,
  notes        jsonb
);

create index if not exists scrape_log_ran_at_idx
  on public.scrape_log (ran_at desc);

-- =====================================================================
-- Row Level Security (RLS)
-- =====================================================================
alter table public.club_state    enable row level security;
alter table public.member_state  enable row level security;
alter table public.match_state   enable row level security;
alter table public.scrape_log    enable row level security;

-- Public read access for the three "state" tables (the website renders
-- from these). The service-role key bypasses RLS so the scraper can
-- still insert/update without any explicit policy.
drop policy if exists "Public read club_state"   on public.club_state;
drop policy if exists "Public read member_state" on public.member_state;
drop policy if exists "Public read match_state"  on public.match_state;

create policy "Public read club_state"
  on public.club_state   for select using (true);
create policy "Public read member_state"
  on public.member_state for select using (true);
create policy "Public read match_state"
  on public.match_state  for select using (true);

-- scrape_log stays private (no SELECT policy) — only the service role
-- can read or write it, which is fine for an internal audit log.
