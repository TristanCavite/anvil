# Anvil — Group Setup Guide

> A step-by-step walkthrough from a fresh machine to a running local dev environment.  
> This is **not** the README. Read this before touching any code.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Dependencies](#3-install-dependencies)
4. [Create the Supabase Project](#4-create-the-supabase-project)
5. [Enable PostGIS](#5-enable-postgis)
6. [Create Storage Bucket](#6-create-storage-bucket)
7. [Run Database Migrations](#7-run-database-migrations)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Run the Dev Server](#9-run-the-dev-server)
10. [Project Structure Overview](#10-project-structure-overview)
11. [Key Routes Reference](#11-key-routes-reference)
12. [Auth & Onboarding Flow](#12-auth--onboarding-flow)
13. [How Listings Work](#13-how-listings-work)
14. [How Reservations Work](#14-how-reservations-work)
15. [Deploying to Netlify](#15-deploying-to-netlify)
16. [Common Gotchas](#16-common-gotchas)

---

## 1. Prerequisites

Make sure the following are installed on your machine before you start.

| Tool | Minimum Version | Check |
|---|---|---|
| Node.js | 18.x or higher | `node -v` |
| npm | 9.x or higher | `npm -v` |
| Git | Any recent version | `git --version` |

You will also need:

- A **Supabase account** — free tier is fine: https://supabase.com
- A **Netlify account** (only needed for deployment): https://netlify.com

---

## 2. Clone the Repository

```bash
git clone <repo-url>
cd anvil
```

Replace `<repo-url>` with the actual GitHub URL. Ask the project owner if you don't have it.

---

## 3. Install Dependencies

From inside the `anvil/` directory:

```bash
npm install
```

This installs everything declared in `package.json`:

| Package | Version | Purpose |
|---|---|---|
| `next` | ^16.1.6 | Framework (App Router) |
| `react` / `react-dom` | ^19.2.4 | UI library |
| `@supabase/supabase-js` | ^2.98.0 | Supabase client |
| `@supabase/ssr` | ^0.9.0 | Supabase SSR helpers for Next.js |
| `tailwindcss` | ^4.2.1 | CSS utility framework (v4) |
| `@tailwindcss/postcss` | ^4.2.1 | Tailwind PostCSS plugin |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^5.0.0 | Interactive map |
| `open-location-code` | ^1.0.3 | Plus Code (OLC) encoding for locations |

---

## 4. Create the Supabase Project

1. Log in at https://supabase.com/dashboard
2. Click **New project**
3. Fill in:
   - **Organization** — your org
   - **Name** — e.g. `anvil-dev`
   - **Database password** — save this somewhere safe
   - **Region** — pick closest to your users
4. Wait for the project to finish provisioning (~1–2 minutes)

---

## 5. Enable PostGIS

PostGIS is required for the distance-based search feature.

1. In your Supabase project, go to **Database → Extensions**
2. Search for `postgis`
3. Toggle it **on**

> If you skip this step, the location queries will fail with a "function does not exist" error.

---

## 6. Create Storage Bucket

Listing photos are stored in Supabase Storage.

1. In your Supabase project, go to **Storage**
2. Click **New bucket**
3. Set the name to exactly: `listing-photos`
4. Check **Public bucket** (so photo URLs work without auth tokens)
5. Click **Save**

> The bucket name must be `listing-photos` — the app hardcodes this name.

---

## 7. Run Database Migrations

All schema changes live in `supabase/migrations/`. They must be run **in numeric order** using the Supabase SQL Editor.

### How to run a migration

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New query**
3. Open the migration file in your editor, copy the entire contents
4. Paste into the SQL Editor and click **Run**
5. Repeat for each file in order

### Migration files

| File | What it does |
|---|---|
| `20260309000001_tables.sql` | Creates all core tables: `profiles`, `seller_businesses`, `listings`, `listing_photos`, `reservations`, `categories` |
| `20260309000002_functions_triggers.sql` | DB functions and triggers (e.g. auto-create profile on sign-up, update timestamps) |
| `20260309000003_rls.sql` | Row Level Security policies — controls who can read/write what |
| `20260309000004_indexes.sql` | Performance indexes on frequently queried columns |
| `20260309000005_expiry_cron.sql` | Scheduled job (pg_cron) to expire stale reservations automatically |
| `20260309000008_avatars_bucket.sql` | Storage RLS policies for the `avatars` bucket |
| `20260309000009_listings_delete_rls.sql` | RLS policy: sellers can delete their own draft listings |
| `20260309000010_fix_buyer_cancel_rls.sql` | RLS fix: buyers can cancel from both `pending_authorization` and `authorized` states |

> **Order matters.** `001` must be run before `002`, etc. Running out of order will cause foreign key or function errors.

---

## 8. Configure Environment Variables

Create a file named `.env.local` at the **project root** (same level as `package.json`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to find these values

1. In your Supabase project, go to **Project Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role / secret key** → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Never commit `.env.local` to Git.** It is already in `.gitignore`.  
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. Keep it server-side only — never expose it in client code.

### Which key does what

| Variable | Used in | Why |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + Server | RLS-enforced public access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Actions only | Bypasses RLS for trusted operations (e.g. advancing reservation status) |

---

## 9. Run the Dev Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

Other scripts:

```bash
npm run build    # production build
npm run start    # run production build locally
npm run lint     # lint check
npm run lint:fix # auto-fix lint issues
```

---

## 10. Project Structure Overview

```
anvil/
├── src/
│   ├── app/                        # Next.js App Router pages and layouts
│   │   ├── page.tsx                # Homepage
│   │   ├── auth/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── callback/route.ts   # Supabase OAuth/magic link callback
│   │   ├── onboarding/page.tsx     # First-time user setup
│   │   ├── listings/
│   │   │   ├── page.tsx            # Public listings feed
│   │   │   └── [id]/page.tsx       # Listing detail
│   │   ├── reservations/
│   │   │   ├── page.tsx            # Buyer: my reservations
│   │   │   └── actions.ts          # createReservation, cancelReservation
│   │   └── seller/
│   │       ├── onboarding/page.tsx # Seller profile setup
│   │       ├── listings/
│   │       │   ├── page.tsx        # Seller: manage listings
│   │       │   ├── new/page.tsx    # Create new listing
│   │       │   ├── [id]/edit/page.tsx
│   │       │   ├── actions.ts      # deleteDraftListing
│   │       │   └── DeleteListingButton.tsx
│   │       └── reservations/
│   │           ├── page.tsx        # Seller: incoming reservations
│   │           ├── actions.ts      # acceptReservation, declineReservation, fulfillReservation
│   │           └── ReservationActions.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── browser.ts          # Client-side Supabase client
│   │       ├── server.ts           # Server Component / Server Action client
│   │       ├── middleware.ts       # Session refresh + auth redirect helper
│   │       └── admin.ts            # Service role client (bypasses RLS)
│   └── middleware.ts               # Root Next.js middleware
├── supabase/
│   └── migrations/                 # All SQL migration files (run in SQL Editor)
├── next.config.ts                  # Next.js config (Supabase image remote patterns)
├── tsconfig.json                   # TypeScript config
├── package.json
└── .env.local                      # YOUR secrets — never commit this
```

### TypeScript path aliases

`tsconfig.json` sets `"baseUrl": "src/"`. This means imports resolve from `src/` without needing relative paths:

```ts
// Instead of this:
import { createClient } from '../../../lib/supabase/browser'

// You write this:
import { createClient } from 'lib/supabase/browser'
```

### Tailwind CSS v4

This project uses **Tailwind v4**, which works differently from v3:

- There is **no `tailwind.config.js`** — Tailwind is configured entirely via CSS
- The global CSS file (`src/app/globals.css`) starts with `@import "tailwindcss"`
- Use utility classes as normal; v4 auto-detects content by scanning your source

---

## 11. Key Routes Reference

| Route | Access | Description |
|---|---|---|
| `/` | Public | Homepage |
| `/auth/sign-in` | Public | Sign in |
| `/auth/sign-up` | Public | Create account |
| `/auth/callback` | Public | Supabase redirect handler (do not remove) |
| `/onboarding` | Auth required | First-time profile setup |
| `/listings` | Public | Browse all active listings |
| `/listings/[id]` | Public | Single listing detail + reserve button |
| `/reservations` | Auth required | Buyer's reservation history |
| `/seller/onboarding` | Auth required | Set up seller profile (one-time) |
| `/seller/listings` | Seller required | Manage your listings |
| `/seller/listings/new` | Seller required | Create a new listing |
| `/seller/listings/[id]/edit` | Seller required | Edit an existing listing |
| `/seller/reservations` | Seller required | View and act on incoming reservations |

---

## 12. Auth & Onboarding Flow

```
Sign up → Verify email (Supabase sends link)
  → /auth/callback  (exchanges code for session)
  → /onboarding     (set display name + location — required once)
  → /listings       (browse as buyer)

To sell:
  → /seller/onboarding  (set business name — required once)
  → /seller/listings    (create/manage listings)
```

Middleware (`src/middleware.ts`) runs on every request and:
- Refreshes the Supabase session automatically
- Redirects logged-in users away from `/auth/sign-in` and `/auth/sign-up`

---

## 13. How Listings Work

### Status lifecycle

```
draft  →  active  →  [sold out / expired]
  ↑
  └── seller can edit and re-publish
```

- Sellers can only **delete** listings while they are in `draft` status
- When creating a listing, the DB row is always inserted as `draft` first (RLS requirement), then immediately updated to `active` if the seller toggled "Publish"
- `quantity_available` decrements automatically when reservations are confirmed
- Photos are stored in Supabase Storage under the path `{user_id}/{listing_id}/{filename}`

### Categories

Categories are seeded in `20260309000001_tables.sql`. They appear as filter chips on the `/listings` feed.

---

## 14. How Reservations Work

No payment processing in v1 — reservations are intent-based.

```
Buyer clicks Reserve
  → INSERT reservation as pending_authorization
  → Server Action immediately advances to authorized  (bypasses Stripe for now)
  → Buyer sees reservation in /reservations
  → Seller sees it in /seller/reservations

Seller actions:
  accept    → status: accepted
  decline   → status: declined
  fulfill   → status: fulfilled  (item handed over)

Buyer can cancel from:
  pending_authorization  OR  authorized  (before seller accepts)
```

Reservations expire automatically after 24 hours if not acted on (handled by pg_cron migration `005`).

---

## 15. Deploying to Netlify

1. Push the repo to GitHub
2. In Netlify: **Add new site → Import an existing project → GitHub**
3. Select the `anvil` repo
4. Build settings (auto-detected for Next.js):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Go to **Site settings → Environment variables** and add the same 3 vars from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Trigger a deploy

> Make sure your Supabase project's **URL Configuration** (Authentication → URL Configuration) includes your Netlify domain in the **Redirect URLs** list, e.g. `https://your-site.netlify.app/auth/callback`.

---

## 16. Common Gotchas

### "new row violates row-level security policy"
- Most likely you are trying to INSERT a listing with `status = 'active'`
- The RLS policy only allows INSERT with `status = 'draft'`
- The app handles this automatically — if you see this error, check `src/app/seller/listings/new/page.tsx`

### Images not showing
- Check that `next.config.ts` has the Supabase remote image pattern
- Check that the `listing-photos` bucket exists and is set to **Public**

### Auth redirect loop
- Make sure your `.env.local` values are correct and the Supabase project is active
- Make sure `/auth/callback` is in Supabase's allowed Redirect URLs

### PostGIS errors on location queries
- You forgot to enable the PostGIS extension — see [Step 5](#5-enable-postgis)

### Tailwind classes not applying
- This project uses Tailwind **v4** — do not install `tailwind.config.js` or use the v3 CLI
- If you add a new CSS file, make sure it imports `tailwindcss` or is imported by the root layout

### Module not found: `lib/supabase/...`
- TypeScript `baseUrl` is `src/` — this only applies to TypeScript/Next.js imports
- If you add a plain `.js` file outside the `src/` tree, you may need relative paths

### `SUPABASE_SERVICE_ROLE_KEY` is undefined at runtime
- This key must **not** be prefixed with `NEXT_PUBLIC_`
- It is only available in Server Actions and API routes, not in client components
- Double-check your `.env.local` spelling

---

*Last updated to match project state: migrations 001–005, 008–010; Next.js 16.1.6; Supabase SSR 0.9.0; Tailwind 4.2.1*
