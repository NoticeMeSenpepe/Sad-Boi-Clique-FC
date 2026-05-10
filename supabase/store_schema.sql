-- =====================================================================
-- Sad Boi Clique FC — Store schema
-- =====================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- =====================================================================

create table if not exists public.store_items (
  id            bigserial    primary key,
  created_by    uuid         references public.profiles(id),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  -- Display name shown on cards (e.g. "HOME SHIRT 25/26").
  name          text         not null,
  -- Price in pounds. Stored as numeric so admins can use decimals.
  price         numeric(10,2) not null default 0,
  -- Category drives the StorePage filter pills. Today these are
  -- 'KITS', 'TRAINING', 'FAN GEAR' but free-text gives admins room
  -- to add new categories (we'll auto-discover them on the page).
  category      text         not null default 'FAN GEAR',
  -- Optional small chip on the card ("NEW DROP", "LIMITED", "BACK IN
  -- STOCK", "BESTSELLER"). Empty string = no chip.
  tag           text         not null default '',
  -- Hex colour used on the tag chip + glow.
  panel_color   text         not null default '#E4002B',
  -- Subtitle / one-line product description ("Adult replica · Aura red").
  subtitle      text         not null default '',
  -- Ordered array of image URLs. The first one is the primary card image;
  -- the rest are alternate angles shown in the product modal carousel.
  images        text[]       not null default '{}',
  sold_out      boolean      not null default false,
  -- Lower numbers come first on the page. Defaults to 100; admins can
  -- nudge the order up/down by editing this number.
  sort_order    int          not null default 100,
  -- Hide the item from the public store without deleting the row.
  visible       boolean      not null default true,
  -- Featured items appear in the homepage's Sad Boi Store carousel.
  featured      boolean      not null default false
);

create index if not exists store_items_sort_idx
  on public.store_items (sort_order asc, created_at desc);

drop trigger if exists store_items_set_updated_at on public.store_items;
create trigger store_items_set_updated_at
  before update on public.store_items
  for each row execute function public.set_updated_at();

-- RLS — public read (only visible rows), admin-only writes.
alter table public.store_items enable row level security;

drop policy if exists "Visible store items publicly readable" on public.store_items;
drop policy if exists "Admins read all store items"           on public.store_items;
drop policy if exists "Admins insert store items"             on public.store_items;
drop policy if exists "Admins update store items"             on public.store_items;
drop policy if exists "Admins delete store items"             on public.store_items;

create policy "Visible store items publicly readable"
  on public.store_items for select using (visible = true);

-- Admins can additionally see hidden rows so they can un-hide them.
create policy "Admins read all store items"
  on public.store_items for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins insert store items"
  on public.store_items for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update store items"
  on public.store_items for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins delete store items"
  on public.store_items for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
