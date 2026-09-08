-- =============================================================================
-- 0004_private_media_bucket.sql  —  Phase 3 of the backend security redesign
-- Digital Official Studio · authored 2026-09-08
-- =============================================================================
--
-- WHY
--   The `media` storage bucket is PUBLIC, so every media_files.file_url is a
--   permanent public URL. Even after 0001 locked the tables (URLs are no longer
--   enumerable), a single leaked/forwarded URL streams a private client's photo
--   forever. Making the bucket private + serving short-lived SIGNED urls closes
--   that: a URL works for one hour, and only the app (service role) can mint one.
--
-- CODE PREREQUISITE — ALREADY SHIPPED (Phase 3 code):
--   lib/storage.ts signMediaUrls() re-signs media on the private DYNAMIC surfaces:
--     app/gallery/[slug], app/collection/[id], app/share/[id],
--     and GET /api/admin/galleries/[id] (feeds admin + portal gallery views).
--   next.config.ts allows the /object/sign/ path for next/image. Signing works
--   whether the bucket is public or private, so the code is safe to deploy first.
--
-- ⚠️ DO NOT APPLY UNTIL THE PORTFOLIO DECISION IS MADE. READ THIS.
--   The PUBLIC home (/) and /portfolio pages are STATIC and render is_portfolio
--   images straight from their public file_url — they do NOT sign (a signed URL
--   baked into static HTML would expire). If you flip this bucket private, those
--   two pages' images break. Two ways forward — pick one before applying:
--
--   OPTION A (recommended): two buckets.
--     * Create a PUBLIC `portfolio` bucket; copy every is_portfolio=true object
--       into it; rewrite those media_files.file_url to the new public URL.
--     * Keep `media` private for client work. Home/portfolio keep working with no
--       expiry; client galleries are signed. (Requires a small data migration +
--       pointing the portfolio "add" toggle at the portfolio bucket.)
--
--   OPTION B: keep one bucket, make home/portfolio DYNAMIC and sign there too
--     (add `export const revalidate = 3600` shorter than the signed-URL TTL, and
--     call signMediaUrls in app/page.tsx + app/portfolio/page.tsx). Simpler, but
--     couples cache lifetime to token lifetime and loses full static delivery.
--
--   Also: app/api/og/route.tsx fetches public file_url for link-preview images.
--   For private galleries that is fine to drop (you don't want private photos in
--   previews); for portfolio OG, it must read from whichever public bucket wins.
--
-- APPLY (after choosing A or B): paste into the SQL editor or `supabase db push`.
-- ROLLBACK: set public = true and re-create the anon read policy.
-- =============================================================================

begin;

-- 1. Flip the bucket to private. Public URLs stop resolving; signed URLs still do.
update storage.buckets set public = false where id = 'media';

-- 2. Remove anonymous read of objects. (Signed URLs carry their own token and do
--    not depend on this policy; authenticated upload/update/delete stay as-is.)
drop policy if exists "Anyone can read media files" on storage.objects;

-- Optional: allow authenticated users to read objects directly (not required when
-- everything is served via signed URLs from the service role — leave commented
-- unless a client-side component needs raw bucket reads):
-- create policy "Authenticated can read media"
--   on storage.objects for select to authenticated using (bucket_id = 'media');

commit;

-- VERIFY: an unsigned public URL should now 400/403, a signed one should 200.
--   curl -s -o /dev/null -w "%{http_code}\n" \
--     "$SUPABASE_URL/storage/v1/object/public/media/<path>"        # expect 400
--   # then load a /gallery/<slug> page and confirm images render (signed).
