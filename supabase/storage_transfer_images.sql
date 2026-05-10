-- =====================================================================
-- Storage bucket: transfer-images
-- Public-read, admin-write. Mirrors the news-images bucket.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('transfer-images', 'transfer-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read transfer images"   on storage.objects;
drop policy if exists "Admins can upload transfer images" on storage.objects;
drop policy if exists "Admins can update transfer images" on storage.objects;
drop policy if exists "Admins can delete transfer images" on storage.objects;

create policy "Public can read transfer images"
  on storage.objects for select
  using (bucket_id = 'transfer-images');

create policy "Admins can upload transfer images"
  on storage.objects for insert
  with check (
    bucket_id = 'transfer-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update transfer images"
  on storage.objects for update
  using (
    bucket_id = 'transfer-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete transfer images"
  on storage.objects for delete
  using (
    bucket_id = 'transfer-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
