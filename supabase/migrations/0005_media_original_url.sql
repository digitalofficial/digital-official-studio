-- =============================================================================
-- 0005_media_original_url.sql  —  "store both" upload support
-- Digital Official Studio · authored 2026-09-08
-- =============================================================================
--
-- WHY
--   Uploads now store TWO objects per photo: a compressed DISPLAY version
--   (media_files.file_url, fast to render) and the full-resolution ORIGINAL
--   (media_files.original_url, used for admin/client downloads). Videos store the
--   same URL in both. Existing rows have original_url = NULL; download falls back
--   to file_url for those, so this is backwards-compatible and safe to apply any
--   time (the upload code tolerates the column being absent only if it is present
--   in prod before the code writes it — apply this BEFORE deploying the new
--   uploader, or the media insert will 400 on the unknown column).
--
-- SAFE / IDEMPOTENT.
-- =============================================================================

begin;

alter table public.media_files add column if not exists original_url text;

commit;
