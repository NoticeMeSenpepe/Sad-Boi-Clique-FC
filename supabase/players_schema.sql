-- =====================================================================
-- Sad Boi Clique FC — Players (lore + static fields) schema
-- =====================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
--
-- This holds the *static* parts of every player profile — name,
-- archetype, lore, attributes, accent colour, image, etc. The
-- dynamic per-match stats (goals, assists, apps, MOTM, …) continue
-- to come from EA via member_state for human players (joined to a
-- row here by ea_user). AI/fictional characters carry their own
-- mock_goals / mock_apps / mock_assists numbers.
-- =====================================================================

create table if not exists public.players (
  id            text         primary key,    -- 'panikova', 'gymskin', etc.
  created_by    uuid         references public.profiles(id),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),

  -- Identity
  name          text         not null,
  short_name    text         not null,
  number        int,
  -- EA Pro Clubs Gamertag. Non-null = "human" player whose live stats
  -- are merged in from member_state.
  ea_user       text,

  -- Position / rating / rarity
  position      text         not null default 'CM',
  rating        int          not null default 70,
  rarity        text         not null default 'common',  -- 'icon' | 'legend' | 'rare' | 'common'
  nationality   text,

  -- 6-key attribute set. Outfielders use {PAC,SHO,PAS,DRI,DEF,PHY};
  -- goalkeepers use {DIV,HAN,KIC,REF,SPD,POS}. Stored as JSONB so
  -- new keys can be added without migrations.
  stats         jsonb        not null default '{}'::jsonb,

  -- Mock career numbers — for AI characters these are the only
  -- source of truth. For human players these get overridden at
  -- read time by the live values from EA's API.
  mock_goals          int,
  mock_apps           int,
  mock_assists        int,
  mock_clean_sheets   int,

  -- Personality chips and lore
  tags          text[]       not null default '{}',
  accent_color  text         not null default '#E4002B',
  -- Optional explicit glow colour (used in card hover shadow). If null
  -- the front-end derives it from accent_color at alpha 0.45.
  glow_color    text,
  archetype     text         not null default '',
  lore          text         not null default '',
  -- Array of {era, note} entries shown in the player profile modal.
  timeline      jsonb        not null default '[]'::jsonb,

  -- Photo (URL or /uploads/foo.png path). Optional — players with no
  -- image render a kit-number placeholder.
  image         text,

  -- Manual ordering on the squad page (lower = earlier).
  sort_order    int          not null default 100,
  -- Hide the player from the public squad without deleting the row.
  visible       boolean      not null default true
);

create index if not exists players_sort_idx
  on public.players (sort_order asc, created_at asc);

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- RLS — public read of visible players, admin-only writes.
alter table public.players enable row level security;

drop policy if exists "Visible players publicly readable" on public.players;
drop policy if exists "Admins read all players"           on public.players;
drop policy if exists "Admins insert players"             on public.players;
drop policy if exists "Admins update players"             on public.players;
drop policy if exists "Admins delete players"             on public.players;

create policy "Visible players publicly readable"
  on public.players for select using (visible = true);

create policy "Admins read all players"
  on public.players for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins insert players"
  on public.players for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update players"
  on public.players for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins delete players"
  on public.players for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
