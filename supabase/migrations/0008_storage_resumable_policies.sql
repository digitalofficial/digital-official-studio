-- 0008 — Allow resumable (TUS) uploads to the media bucket.
--
-- SYMPTOM: small photos upload fine, but VIDEOS (and any file >6MB) fail with
-- "new row violates row-level security policy" / HTTP 403.
--
-- WHY: large files use the resumable/TUS path (lib/upload.ts →
-- /storage/v1/upload/resumable), which writes to Supabase's S3 multipart
-- tracking tables in addition to storage.objects. storage.objects already has an
-- "authenticated can insert into media" policy (so the standard small-file path
-- works), but the multipart tables have RLS enabled with NO policy for
-- authenticated users — so the very first resumable step is denied.
--
-- FIX: grant authenticated users full access to the multipart rows for the media
-- bucket, and (idempotently) re-assert the storage.objects write policies.

-- Multipart upload tracking (resumable/TUS) ----------------------------------
drop policy if exists "authenticated manage multipart uploads (media)" on storage.s3_multipart_uploads;
create policy "authenticated manage multipart uploads (media)"
  on storage.s3_multipart_uploads for all
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

drop policy if exists "authenticated manage multipart parts (media)" on storage.s3_multipart_uploads_parts;
create policy "authenticated manage multipart parts (media)"
  on storage.s3_multipart_uploads_parts for all
  to authenticated
  using (bucket_id = 'media')
  with check (bucket_id = 'media');

-- Re-assert the object write policies (idempotent; harmless if already present) --
drop policy if exists "Authenticated users can upload media" on storage.objects;
create policy "Authenticated users can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

drop policy if exists "Authenticated users can update media" on storage.objects;
create policy "Authenticated users can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

drop policy if exists "Authenticated users can delete media" on storage.objects;
create policy "Authenticated users can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');
