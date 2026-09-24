-- 0007 — Per-gallery display settings (client-facing gallery customization).
--
-- Adds two nullable-with-default columns to client_galleries so each gallery can
-- choose its own layout and whether the social share buttons show. The app code
-- (GalleryView + admin detail page + PUT route) already tolerates these columns
-- being absent — it falls back to the defaults below and the admin toggle simply
-- won't persist until this migration is applied.

alter table public.client_galleries
  add column if not exists show_social boolean not null default true;

alter table public.client_galleries
  add column if not exists layout text not null default 'masonry'
  check (layout in ('masonry', 'grid', 'editorial'));
