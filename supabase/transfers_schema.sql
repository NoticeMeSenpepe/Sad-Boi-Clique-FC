-- =====================================================================
-- Sad Boi Clique FC — Transfers schema
-- =====================================================================
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- =====================================================================

create table if not exists public.transfers (
  id            bigserial    primary key,
  created_by    uuid         references public.profiles(id),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  -- When the transfer story should be considered "live" — drives the
  -- ordering on the Transfers page (newest first).
  happened_at   timestamptz  not null default now(),
  -- The player the transfer is about. Free-text (might be a real human
  -- player like "PANIKOVA" or a bit of bit like "UNKNOWN SIGNING").
  player        text         not null,
  -- The other club involved in the move — incoming or outgoing.
  club          text         not null,
  -- Free-text fee. Lets admins write "£10m", "Undisclosed", "Free",
  -- "Loyalty", "Three magic beans", etc.
  fee           text         not null default 'Undisclosed',
  -- Display label for the chip ("HERE WE GO ✓", "CONTRACT EXTENDED",
  -- "DEVELOPING STORY", "DEPARTED", "REJECTED"). Free-text so admins
  -- can write whatever.
  status_label  text         not null default 'DEVELOPING STORY',
  -- Hex color used for the panel's left border + chip background.
  panel_color   text         not null default '#E4002B',
  -- Long-form narrative shown when the row is expanded.
  detail        text         not null default '',
  -- Optional player image (URL or /uploads/foo.png path).
  image_url     text
);

create index if not exists transfers_happened_at_idx
  on public.transfers (happened_at desc);

drop trigger if exists transfers_set_updated_at on public.transfers;
create trigger transfers_set_updated_at
  before update on public.transfers
  for each row execute function public.set_updated_at();

-- RLS — public read, admin-only write.
alter table public.transfers enable row level security;

drop policy if exists "Transfers publicly readable" on public.transfers;
drop policy if exists "Admins insert transfers"     on public.transfers;
drop policy if exists "Admins update transfers"     on public.transfers;
drop policy if exists "Admins delete transfers"     on public.transfers;

create policy "Transfers publicly readable"
  on public.transfers for select using (true);

create policy "Admins insert transfers"
  on public.transfers for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update transfers"
  on public.transfers for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins delete transfers"
  on public.transfers for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
