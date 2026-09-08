# Supabase migrations — backend security redesign

These were authored 2026-09-08 during the audit remediation. The committed
`../../supabase-schema.sql` is **stale** and does not describe production — treat
these migrations + a real baseline dump as the source of truth.

## Apply order

1. **Capture the real baseline first** (nothing else is safe without it):
   ```bash
   supabase link --project-ref decqfnklvpoxyfpjyuse
   supabase db dump --schema public -f supabase/migrations/0000_baseline.sql
   ```
2. **`0001_rls_lockdown.sql`** — drops the `to anon using(true)` policies that
   exposed the whole schema to the browser anon key; deny-all + one self-select
   policy on `profiles`. Safe: all app access is service-role server-side.
   Verify with the anon-key block at the bottom of the file (reads → `*/0`).
3. **Deploy the Phase 2 code** (already committed) BEFORE step 4 — it stops
   writing `password_plain`. Applying 0002 before the code ships makes every
   user/gallery/collection create 400 (PGRST204).
4. **`0002_drop_password_plain.sql`** — `DROP COLUMN password_plain` ×3.
5. **`0003_fk_on_delete.sql`** — normalises FKs to auth.users/profiles so
   deleting a user who owns galleries can't fail. Run its diagnostic query first.
6. **`0005_media_original_url.sql`** — adds `media_files.original_url` for the
   "store both" uploader (compressed display + full-res original). Apply BEFORE/
   with deploying the upload code (the media route writes `original_url`; it
   retries without it if the column is missing, so it degrades rather than breaks).
   Backwards-compatible: old rows fall back to `file_url` for downloads.
7. **`0004_private_media_bucket.sql`** — makes the `media` bucket private + signed
   URLs. **Do not apply until the portfolio-bucket decision (Option A/B) in the
   file is made** — it will break the static home/portfolio images otherwise.
   The Phase 3 code (lib/storage.ts signing) is already live and works either way.
   (Numbered 0004 but apply it LAST, after the bucket decision.)

## Status (2026-09-08)
Authored and committed on branch `backend-redesign`. **None applied to prod yet.**
Build passes. Review each file's header comment before applying.
