# Digital Official Studio

Photography / creative-studio platform for Digital Official — a public portfolio plus a
client-gallery and booking system. Clients view and download their photo collections
through a token-shared link or an authenticated portal; an admin back office manages
galleries, collections, bookings, and users.

## Surface

- **Public:** `/` (home), `/portfolio`
- **Client-shared (dynamic, not indexed):** `/gallery/[slug]`, `/collection/[id]`, `/share/[id]`
- **Client portal (auth):** `/portal/*` — bookings, collections, settings
- **Admin (auth):** `/admin/*` — dashboard, galleries, collections, bookings, users, settings, trash
- **Auth:** `/login`, `/reset-password`

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19, Tailwind CSS 4, `react-masonry-css` |
| Data / auth / storage | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Language | TypeScript 5 |

## Commands

```bash
npm run dev     # start dev server (localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Environment

Configure a local `.env.local` (gitignored). At minimum the Supabase client keys are required:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Confirm the full env set against the Supabase project before deploying.

## Deploy

Vercel (Next.js). Canonical production domain: **TBD — not yet recorded** (add it to the
vault `Domains.md` and set `metadataBase` / `NEXT_PUBLIC_SITE_URL` before adding a sitemap).
