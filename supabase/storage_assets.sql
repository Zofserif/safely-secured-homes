-- Supabase Storage setup for hybrid media handling.
-- Run this in Supabase SQL editor after creating your project.
-- Static app-owned assets stay in /public/assets (Git-tracked).
-- Dynamic assets (email media/uploads) should be stored in these buckets.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'user-assets',
    'user-assets',
    true,
    104857600,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
  ),
  (
    'brand-assets',
    'brand-assets',
    true,
    20971520,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml'
    ]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read user and brand assets" on storage.objects;
create policy "Public read user and brand assets"
on storage.objects
for select
to public
using (bucket_id in ('user-assets', 'brand-assets'));

drop policy if exists "Service role manages user and brand assets" on storage.objects;
create policy "Service role manages user and brand assets"
on storage.objects
for all
to public
using (
  auth.role() = 'service_role'
  and bucket_id in ('user-assets', 'brand-assets')
)
with check (
  auth.role() = 'service_role'
  and bucket_id in ('user-assets', 'brand-assets')
);
