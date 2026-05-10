-- =====================================================================
-- Sad Boi Clique FC — Storage bucket: news-images
-- =====================================================================
-- Creates a public-readable storage bucket where the admin News editor
-- uploads lead images, and configures the RLS so:
--   * anyone can view images (so the website can render them);
--   * only signed-in admins can upload / replace / delete.
-- Run this in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- =====================================================================

-- 1. Create the bucket if it doesn't exist.
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;

-- 2. RLS policies on storage.objects scoped to this bucket.
drop policy if exists "Public can read news images"   on storage.objects;
drop policy if exists "Admins can upload news images" on storage.objects;
drop policy if exists "Admins can update news images" on storage.objects;
drop policy if exists "Admins can delete news images" on storage.objects;

create policy "Public can read news images"
  on storage.objects for select
  using (bucket_id = 'news-images');

create policy "Admins can upload news images"
  on storage.objects for insert
  with check (
    bucket_id = 'news-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update news images"
  on storage.objects for update
  using (
    bucket_id = 'news-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete news images"
  on storage.objects for delete
  using (
    bucket_id = 'news-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
