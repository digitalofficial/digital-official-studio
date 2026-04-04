-- =============================================
-- Digital Official Studio - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. BOOKINGS TABLE
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  event_type text not null,
  event_date date,
  package text,
  message text,
  photographer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Migration: Add photographer_id to existing bookings table
-- alter table public.bookings add column if not exists photographer_id uuid references public.profiles(id) on delete set null;

-- 2. CLIENT GALLERIES TABLE
create table if not exists public.client_galleries (
  id uuid default gen_random_uuid() primary key,
  client_name text not null,
  event_name text not null,
  slug text unique not null,
  password_hash text not null,
  is_public boolean default false,
  category text default 'Other',
  created_at timestamptz default now()
);

-- 3. MEDIA FILES TABLE
create table if not exists public.media_files (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid references public.client_galleries(id) on delete cascade not null,
  file_url text not null,
  file_type text not null check (file_type in ('photo', 'video')),
  caption text,
  is_portfolio boolean default false,
  created_at timestamptz default now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
alter table public.bookings enable row level security;
alter table public.client_galleries enable row level security;
alter table public.media_files enable row level security;

-- BOOKINGS: anyone can insert (contact form), only authenticated users can read
create policy "Anyone can create bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated users can read bookings"
  on public.bookings for select
  to authenticated
  using (true);

create policy "Authenticated users can delete bookings"
  on public.bookings for delete
  to authenticated
  using (true);

-- CLIENT GALLERIES: public can read public galleries, authenticated can do everything
create policy "Anyone can read public galleries"
  on public.client_galleries for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert galleries"
  on public.client_galleries for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update galleries"
  on public.client_galleries for update
  to authenticated
  using (true);

create policy "Authenticated users can delete galleries"
  on public.client_galleries for delete
  to authenticated
  using (true);

-- MEDIA FILES: public can read files from public galleries or portfolio files, authenticated can do everything
create policy "Anyone can read portfolio media"
  on public.media_files for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert media"
  on public.media_files for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update media"
  on public.media_files for update
  to authenticated
  using (true);

create policy "Authenticated users can delete media"
  on public.media_files for delete
  to authenticated
  using (true);

-- 4. PROFILES TABLE (user roles)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  role text not null default 'client' check (role in ('admin', 'photographer', 'client')),
  assigned_galleries uuid[] default '{}',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can insert profiles"
  on public.profiles for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update profiles"
  on public.profiles for update
  to authenticated
  using (true);

create policy "Authenticated users can delete profiles"
  on public.profiles for delete
  to authenticated
  using (true);

-- 5. SHARED LINKS TABLE
create table if not exists public.shared_links (
  id uuid default gen_random_uuid() primary key,
  gallery_id uuid references public.client_galleries(id) on delete cascade not null,
  photo_ids uuid[] not null,
  shared_by text,
  created_at timestamptz default now()
);

alter table public.shared_links enable row level security;

create policy "Anyone can read shared links"
  on public.shared_links for select
  to anon, authenticated
  using (true);

create policy "Anyone can create shared links"
  on public.shared_links for insert
  to anon, authenticated
  with check (true);

create policy "Authenticated users can delete shared links"
  on public.shared_links for delete
  to authenticated
  using (true);

-- 6. COLLECTIONS TABLE
create table if not exists public.collections (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  gallery_id uuid references public.client_galleries(id) on delete cascade not null,
  photo_ids uuid[] not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table public.collections enable row level security;

create policy "Anyone can read collections"
  on public.collections for select
  to anon, authenticated
  using (true);

create policy "Authenticated users can create collections"
  on public.collections for insert
  to authenticated
  with check (true);

create policy "Authenticated users can delete own collections"
  on public.collections for delete
  to authenticated
  using (true);

-- =============================================
-- STORAGE BUCKETS
-- =============================================

-- Create media bucket (for all uploads)
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Storage policies for media bucket
create policy "Anyone can read media files"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "Authenticated users can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media');

create policy "Authenticated users can update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media');

create policy "Authenticated users can delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media');
