-- =====================================================================
-- Storage bucket: store-images
-- Public-read, admin-write. Used by the admin Store form to upload
-- product photos.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('store-images', 'store-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read store images"   on storage.objects;
drop policy if exists "Admins can upload store images" on storage.objects;
drop policy if exists "Admins can update store images" on storage.objects;
drop policy if exists "Admins can delete store images" on storage.objects;

create policy "Public can read store images"
  on storage.objects for select
  using (bucket_id = 'store-images');

create policy "Admins can upload store images"
  on storage.objects for insert
  with check (
    bucket_id = 'store-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update store images"
  on storage.objects for update
  using (
    bucket_id = 'store-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete store images"
  on storage.objects for delete
  using (
    bucket_id = 'store-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
