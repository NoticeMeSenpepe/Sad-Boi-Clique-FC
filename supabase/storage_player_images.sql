-- =====================================================================
-- Storage bucket: player-images
-- Public-read, admin-write. Used by the admin Player Lore form.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('player-images', 'player-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can read player images"   on storage.objects;
drop policy if exists "Admins can upload player images" on storage.objects;
drop policy if exists "Admins can update player images" on storage.objects;
drop policy if exists "Admins can delete player images" on storage.objects;

create policy "Public can read player images"
  on storage.objects for select
  using (bucket_id = 'player-images');

create policy "Admins can upload player images"
  on storage.objects for insert
  with check (
    bucket_id = 'player-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update player images"
  on storage.objects for update
  using (
    bucket_id = 'player-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete player images"
  on storage.objects for delete
  using (
    bucket_id = 'player-images'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
