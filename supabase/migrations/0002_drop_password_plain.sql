-- =============================================================================
-- 0002_drop_password_plain.sql  —  Phase 2a of the backend security redesign
-- Digital Official Studio · authored 2026-09-08 (audit remediation, App Audit §12j)
-- =============================================================================
--
-- WHY
--   `password_plain` stores a CLEARTEXT credential and exists on THREE tables:
--     profiles          — the user's actual login password
--     client_galleries  — the gallery's share password
--     collections       — the collection's share password
--   All three were anon-readable before 0001. They are redundant: login auth is
--   in Supabase Auth, and gallery/collection/share gates already store a bcrypt
--   `password_hash`. The plaintext existed only so an admin could re-read a
--   password to hand it to a client — replaced by a "show once at creation"
--   flow in the app (see the Phase 2 code change; no re-readable copy is kept).
--
-- ORDERING — APPLY ONLY AFTER THE PHASE 2 CODE IS DEPLOYED.
--   PostgREST rejects the ENTIRE write if the request body names a column that
--   no longer exists (PGRST204). So the app must STOP writing password_plain
--   first (it now does — every insert/update dropped the field), THEN this runs.
--   Applying this before that code is live will 400 every user/gallery/collection
--   create + password reset.
--
-- SAFE / IDEMPOTENT: `drop column if exists`.
-- ROLLBACK: `alter table <t> add column password_plain text;` (data is gone —
--   that is the point; passwords are re-issued via the show-once flow).
-- =============================================================================

begin;

alter table public.profiles         drop column if exists password_plain;
alter table public.client_galleries drop column if exists password_plain;
alter table public.collections      drop column if exists password_plain;

commit;

-- VERIFY (anon or service key): a select naming the column now 400s.
--   curl -s -o /dev/null -w "%{http_code}\n" \
--     "$SUPABASE_URL/rest/v1/profiles?select=password_plain&limit=0" \
--     -H "apikey: $KEY" -H "Authorization: Bearer $KEY"     # expect 400 (column gone)
