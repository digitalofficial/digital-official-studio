-- =============================================================================
-- 0001_rls_lockdown.sql  —  Phase 1 of the backend security redesign
-- Digital Official Studio · authored 2026-09-08 (audit remediation, blocker B2)
-- =============================================================================
--
-- WHY
--   Every table's SELECT policy was `to anon, authenticated using (true)`, so the
--   browser anon key (which ships in the client bundle) could read the ENTIRE
--   schema via PostgREST — including private galleries, every media URL, all
--   password_hash values, and cleartext password_plain on THREE tables
--   (profiles, collections, client_galleries). The in-app PasswordForm gates
--   were decorative. Proven live 2026-09-08 with the anon key.
--
-- HOW THIS IS SAFE
--   The app never relies on anon/authenticated DIRECT table access, with ONE
--   exception. Verified against the code 2026-09-08:
--     * All public/portal/admin reads run server-side via the SERVICE ROLE
--       (createServiceRoleClient), which BYPASSES RLS. (app/page, /portfolio,
--       /gallery/[slug], /collection/[id], /share/[id], /portal, all /api/*.)
--     * The contact form and share-link creation POST to server routes
--       (/api/bookings, /api/share) — also service role. So anon needs NO
--       table policy at all.
--     * The ONLY browser-side table read is app/login/page.tsx:30 —
--       `profiles.select('role').eq('id', <own uid>)` after sign-in.
--   Therefore: deny-all on every table + one self-select policy on profiles.
--   The service role continues to power the whole app; anon/authenticated lose
--   all other direct access.  (Do NOT `force row level security` — that would
--   also block the service role. Plain RLS is bypassed by service_role, which
--   is exactly what we want.)
--
-- SCOPE / WHAT THIS DOES NOT DO (later phases)
--   * Does NOT drop password_plain yet — code still writes it. That is Phase 2
--     (stop writing it in the app FIRST, then DROP COLUMN — PGRST204 rejects the
--     whole write if code names a column that no longer exists). RLS here already
--     makes it unreadable by anon/authenticated, closing the acute exposure.
--   * Does NOT change the public `media` storage bucket. Images still render from
--     public URLs. Making the bucket private + signed URLs is Phase 3.
--   * Does NOT add FK ON DELETE rules. Phase 2 (user deletion hardening).
--
-- BASELINE FIRST
--   Before applying this, capture the REAL current schema as 0000_baseline.sql:
--     supabase link --project-ref decqfnklvpoxyfpjyuse
--     supabase db dump --schema public -f supabase/migrations/0000_baseline.sql
--   The committed ../../supabase-schema.sql is STALE (missing slug, is_private,
--   password_hash, deleted_at, created_by, watermark_*, is_paid, password_plain
--   on collections/client_galleries). Do not treat it as the source of truth.
--
-- APPLY (review first): paste into the Supabase SQL editor, or
--     supabase db push
-- ROLLBACK: re-create the old permissive policies from 0000_baseline.sql.
-- =============================================================================

begin;

-- 1. Ensure RLS is on (idempotent; it already is in prod).
alter table public.bookings         enable row level security;
alter table public.client_galleries enable row level security;
alter table public.media_files      enable row level security;
alter table public.profiles         enable row level security;
alter table public.shared_links     enable row level security;
alter table public.collections      enable row level security;

-- 2. Drop EVERY existing policy on these tables (drift-proof — we do not rely on
--    knowing the live policy names, which have diverged from the committed SQL).
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('bookings','client_galleries','media_files',
                        'profiles','shared_links','collections')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 3. The single required policy: a signed-in user may read THEIR OWN profile row
--    (app/login/page.tsx reads its own role right after sign-in). No other
--    anon/authenticated table access exists in the app.
create policy "own profile is self-readable"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- 4. Everything else is now deny-all for anon and authenticated. The service role
--    (server routes) bypasses RLS and keeps the app fully functional.

commit;

-- =============================================================================
-- VERIFY after applying (from a shell, with the ANON key — expect lockdown):
--   ANON=<anon key>;  U=https://decqfnklvpoxyfpjyuse.supabase.co/rest/v1
--   for t in profiles client_galleries media_files collections shared_links; do
--     curl -s -D - -o /dev/null "$U/$t?select=id" -H "apikey: $ANON" \
--       -H "Authorization: Bearer $ANON" -H "Range: 0-0" -H "Prefer: count=exact" \
--       | grep -i content-range   # expect: content-range: */0  (was 0-6/7 etc.)
--   done
-- And smoke-test the app: home, /portfolio, a /gallery/<slug> (password), the
-- portal, and admin — all read via service role and must still work. Log in
-- (exercises the one authenticated self-select policy).
-- =============================================================================
