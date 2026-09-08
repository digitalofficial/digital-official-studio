-- =============================================================================
-- 0003_fk_on_delete.sql  —  Phase 2b of the backend security redesign
-- Digital Official Studio · authored 2026-09-08
-- =============================================================================
--
-- WHY
--   Deleting a user runs `auth.admin.deleteUser(id)` (app/api/admin/users/[id]
--   DELETE, line 60). If any foreign key pointing at auth.users / profiles has
--   ON DELETE NO ACTION or RESTRICT, deleting a user who OWNS rows (a
--   photographer with galleries, an uploader of media) fails with a FK violation
--   — the "can't delete users" class. The live schema drifted (client_galleries
--   gained created_by/deleted_by, media_files gained uploaded_by/deleted_by,
--   collections gained deleted_by) with UNKNOWN on-delete rules — the committed
--   SQL doesn't describe them. This normalises them so a delete can never block.
--
-- POLICY CHOICE (review this — it is a product decision, not mechanical):
--   * ACTOR columns (deleted_by, uploaded_by, created_by where NULLABLE)
--       → ON DELETE SET NULL. The row survives; we just forget who did it.
--   * OWNER columns that are NOT NULL (e.g. collections.created_by)
--       → this migration makes them NULLABLE then SET NULL, so deleting the
--         owner orphans the collection rather than cascade-deleting a client's
--         work. If you would rather CASCADE (delete the owned rows with the
--         user) or reassign to an admin, change the marked line before applying.
--
-- RUN THE DIAGNOSTIC FIRST (read-only) to see what you actually have:
--   select con.conname, rel.relname as tbl, att.attname as col,
--          con.confdeltype as on_delete,   -- a=no action r=restrict c=cascade n=set null d=set default
--          frel.relname as refs
--   from pg_constraint con
--   join pg_class rel   on rel.oid  = con.conrelid
--   join pg_class frel  on frel.oid = con.confrelid
--   join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
--   where con.contype = 'f'
--     and rel.relnamespace = 'public'::regnamespace
--     and rel.relname in ('profiles','client_galleries','media_files',
--                         'collections','shared_links','bookings')
--   order by tbl, col;
--
-- REQUIRES a baseline dump (0000_baseline.sql) reviewed first, since this
-- rewrites constraints. SAFE to re-run (only touches constraints that block).
-- =============================================================================

begin;

do $$
declare
  r record;
  is_notnull boolean;
begin
  for r in
    select con.conname,
           con.conrelid::regclass::text as tbl,
           att.attname                  as col,
           con.confrelid::regclass::text as refs,
           con.confdeltype
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.conrelid::regclass::text in (
        'public.profiles','public.client_galleries','public.media_files',
        'public.collections','public.shared_links','public.bookings')
      -- only FKs that point at a user identity and would block a user delete
      and con.confrelid in ('auth.users'::regclass, 'public.profiles'::regclass)
      and con.confdeltype in ('a','r')   -- NO ACTION / RESTRICT = blocks deletion
  loop
    raise notice 'normalising FK % on %.% -> % (was %)',
      r.conname, r.tbl, r.col, r.refs, r.confdeltype;

    -- if the owning column is NOT NULL we must relax it so SET NULL is legal
    select attnotnull into is_notnull
    from pg_attribute
    where attrelid = r.tbl::regclass and attname = r.col;

    if is_notnull then
      -- <<< CHANGE HERE if you prefer CASCADE / reassign over orphan-on-delete >>>
      execute format('alter table %s alter column %I drop not null', r.tbl, r.col);
    end if;

    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    execute format(
      'alter table %s add constraint %I foreign key (%I) references %s(id) on delete set null',
      r.tbl, r.conname, r.col, r.refs);
  end loop;
end $$;

commit;

-- After applying, re-run the diagnostic above: every on_delete should now be
-- 'n' (set null) or 'c' (cascade). Then delete a throwaway photographer who owns
-- a gallery to confirm the delete succeeds end-to-end.
