-- =====================================================================
-- Sad Boi Clique FC — News Articles schema
-- =====================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
--
-- Adds:
--   * news_articles  — one row per published front-page story.
--                      Public readable; admin-only writes.
-- =====================================================================

create table if not exists public.news_articles (
  id            bigserial    primary key,
  created_by    uuid         references public.profiles(id),
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  -- When the article should be considered "live". Lets us schedule posts
  -- in the future too. Default: now().
  published_at  timestamptz  not null default now(),
  headline      text         not null,
  summary       text         not null default '',
  -- Long-form body. Plain text for now (line breaks preserved).
  body          text         not null default '',
  tag           text         not null default 'NEWS',
  -- Hex colour for the tag chip — e.g. '#E4002B', '#2a9d8f'. The front-end
  -- will fall back to var(--accent) if this is missing/invalid.
  tag_color     text         not null default '#E4002B',
  -- Optional small label rendered above the headline ("Exclusive
  -- Investigation", "The Moldova Incident, 2023" etc.).
  kicker        text,
  -- URL or path to a lead image (e.g. /uploads/news-aurapulse.png or an
  -- https:// URL). Optional — articles can be image-less.
  image_url     text,
  -- Optional byline. Frontend will use this if set, else fall back to a
  -- generic "Sad Boi Clique" string.
  author        text,
  -- Trending flag — surfaced as a 🔥 / pulsing border on the front page.
  hot           boolean      not null default false
);

create index if not exists news_articles_published_at_idx
  on public.news_articles (published_at desc);

-- Auto-bump updated_at on UPDATE. Reuses the function defined in auth_schema.sql.
drop trigger if exists news_articles_set_updated_at on public.news_articles;
create trigger news_articles_set_updated_at
  before update on public.news_articles
  for each row execute function public.set_updated_at();

-- Row Level Security: anyone can read, only admins can write.
alter table public.news_articles enable row level security;

drop policy if exists "News articles publicly readable" on public.news_articles;
drop policy if exists "Admins insert news"             on public.news_articles;
drop policy if exists "Admins update news"             on public.news_articles;
drop policy if exists "Admins delete news"             on public.news_articles;

create policy "News articles publicly readable"
  on public.news_articles for select using (true);

create policy "Admins insert news"
  on public.news_articles for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins update news"
  on public.news_articles for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins delete news"
  on public.news_articles for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));
