# Plan: NeighborGoods — Full App (End-to-End)

## Decisions
- App name: **NeighborGoods**
- Payments: **Stripe in v1** (Payment Intents with manual capture + webhooks)
- Starting from **scratch** (no existing code)
- Stack: Next.js (App Router) + TypeScript / Supabase / Stripe / Netlify

---

## Phase 1: Project Foundation

1. **Scaffold Next.js project** — `create-next-app` with App Router + TypeScript, configure absolute imports, ESLint, Prettier
2. **Supabase project init** — create project, set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), add `@supabase/ssr` client helpers (browser + server)
3. **Database schema** — run migrations for all tables (see schema section below)
4. **RLS policies** — public read active listings; reservations/messages restricted to participants; admin allowlist access; audit log append-only (INSERT only, no UPDATE/DELETE)
5. **TypeScript types** — generate from Supabase schema, place in `lib/types/database.ts`
6. **Auth setup** — enable Google OAuth + email/password in Supabase; create auth callback route `/auth/callback`; auto-create `profiles` row on sign-up with `is_seller = false`; middleware to protect `/seller/*`, `/admin/*`, `/reservations/*`

---

## Phase 2: UI Shell & Public Pages

7. **Global layout** — navbar (logo, Browse, Sign In / user menu), footer; `app/layout.tsx`
8. **Landing page** (`/`) — hero section + CTA → /listings; no listings feed
9. **Auth pages** — `/sign-in`, `/sign-up` with Google + email/password forms; default role = buyer; redirect handling post-auth
10. **Listings feed** (`/listings`) — grid of product cards; search bar (title/desc); filters: category, price range, distance; "Use my location" with manual fallback
11. **Listing detail** (`/listings/[id]`) — photos, title/desc, category, price, quantity, pickup window, status; seller/business block with Plus Code; "Reserve" or "Sign in to reserve" CTA; Report action

---

## Phase 3: Seller Features

12. **Seller onboarding flow** — user opts into seller capability (`is_seller = true`); create/edit `seller_business` (business name, address, location modal)
13. **Location setup modal** — Shopee-style address search/autocomplete → geocode → lat/lng stored; Plus Code derived (open-location-code library); optional mini-map to fine-tune; must complete before publishing listings
14. **Listing CRUD** — `/seller/listings` list; `/seller/listings/new` and `/seller/listings/[id]/edit`; photo upload via Supabase Storage; `quantity` set by seller; must have valid location before publishing
15. **Seller reservation dashboard** — `/seller/reservations` list; `/seller/reservations/[id]` detail with accept/decline (requires cancellation reason on decline), mark-fulfilled, chat, rating visibility

---

## Phase 4: Reservations & Payments

16. **Reservation creation** — buyer applies → server creates Stripe Payment Intent with `capture_method: manual`; card is HELD (authorized) but NOT charged yet; reservation status = `pending_authorization`; `listings.quantity_available` decremented via Postgres trigger; if `quantity_available = 0` → listing status → `sold_out`
17. **Stripe integration** — Payment Intents with manual capture only; `/api/stripe/webhook` is the source of truth:
    - `payment_intent.amount_capturable_updated` → reservation status: `authorized`; `expires_at` set to `authorized_at + 72h`
    - Seller accepts → server calls `stripe.paymentIntents.capture()` → `payment_intent.succeeded` webhook → status: `paid`
    - Seller declines → seller selects preset reason → server calls `stripe.paymentIntents.cancel()` → hold released; status: `declined`; `cancellation_reason` + `cancelled_by = seller` stored; `quantity_available` restored
    - Buyer cancels (while `authorized`, before accepted) → cancel intent → hold released; status: `cancelled`; `cancellation_reason = buyer_cancelled`, `cancelled_by = buyer`; quantity restored
18. **Reservation status lifecycle**:
    - `pending_authorization → authorized → accepted → paid → fulfilled` ← rating unlocked here
    - `authorized → declined` (seller declines with reason)
    - `authorized → cancelled` (buyer self-cancels)
    - `authorized → expired` (72h timeout or listing expired — system)
    - `paid → refunded` (Stripe webhook)
19. **Buyer reservation pages** — `/reservations` list; `/reservations/[id]` detail with human-readable status + reason, chat, report, rating UI (post-fulfilled only)
20. **Auto sold-out & expiry handling** — pg_cron job every 15 min handles:
    - Reservations where `expires_at < now()` and `status = authorized` → cancel Stripe intent → status `expired` → `cancellation_reason = seller_no_response`, `cancelled_by = system` → restore `quantity_available` → restore listing to `active` if was `sold_out`
    - Listings where `pickup_end < now()` and `status IN (active, sold_out)` → status `expired` → cancel all `authorized` reservations on that listing (Stripe cancel + status `expired` + `cancellation_reason = listing_expired`, `cancelled_by = system`)
    - All expiry events written to `activity_log`

---

## Phase 5: Messaging & Ratings

21. **Reservation chat** — Supabase Realtime subscription on `messages` table; scoped per reservation; removed-message stub if moderated; ordered display
22. **Ratings system** — `/reservations/[id]` shows rating form only when `status = fulfilled` and no prior rating exists; 1–5 stars + optional text; one rating per reservation (UNIQUE constraint on `reservation_id`); stored against `seller_business_id`

---

## Phase 6: Reporting & Admin

23. **Reporting system** — "Report" action on listings, messages, profiles, reservations, ratings; creates row in `reports` table with `target_type` + `target_id`
24. **Admin dashboard** (`/admin`) — access gated by `is_admin` allowlist; reports queue with triage; enforcement actions: hide listing, remove message, remove rating, suspend user; writes to `enforcement_actions` + `activity_log`
25. **Activity log viewer** (`/admin/activity-log`) — append-only audit trail; filterable by entity type, action, date range, actor (user/system)

---

## Phase 7: Polish & Deploy

26. **Testing** — integration tests for auth flows, Stripe webhook handler, RLS policy smoke tests; manual QA for all reservation status transitions
27. **Netlify deployment** — configure build settings (`next build`), env vars, Supabase + Stripe secrets; set up Stripe webhook endpoint pointing to production URL
28. **Performance & security audit** — image optimization, lazy loading, OWASP check (Stripe webhook signature verification, RLS completeness, no service-role key on client)

---

## Database Schema

### `profiles`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | mirrors `auth.users.id` |
| `display_name` | `text` | |
| `phone` | `text` | nullable |
| `is_seller` | `boolean` | default `false` |
| `is_admin` | `boolean` | default `false` — allowlist only |
| `suspended_until` | `timestamptz` | nullable |
| `created_at`, `updated_at` | `timestamptz` | |

### `seller_business`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `owner_id` | `uuid` FK → `profiles.id` | |
| `business_name` | `text` | |
| `address_line`, `city`, `province`, `postal_code` | `text` | |
| `lat`, `lng` | `float8` | required before listing can go live |
| `plus_code` | `text` | derived from lat/lng |
| `created_at`, `updated_at` | `timestamptz` | |

### `listings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `seller_business_id` | `uuid` FK → `seller_business.id` | |
| `title`, `description` | `text` | |
| `category` | `text` | |
| `price` | `numeric` | set by seller |
| `currency` | `text` | default `'PHP'` |
| `quantity` | `int` | original total |
| `quantity_available` | `int` | decremented/restored by triggers |
| `pickup_start`, `pickup_end` | `timestamptz` | |
| `status` | `text` | `draft \| active \| sold_out \| expired \| removed` |
| `created_at`, `updated_at` | `timestamptz` | |

### `listing_photos`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` FK → `listings.id` | |
| `storage_path` | `text` | Supabase Storage path |
| `order` | `int` | display order |

### `reservations`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` FK → `listings.id` | |
| `buyer_id` | `uuid` FK → `profiles.id` | |
| `price_snapshot` | `numeric` | locked at reservation time |
| `currency` | `text` | |
| `status` | `text` | `pending_authorization \| authorized \| accepted \| paid \| fulfilled \| declined \| cancelled \| expired \| refunded` |
| `cancellation_reason` | `text` | nullable: `no_stock \| wrong_item \| pickup_not_possible \| other \| buyer_cancelled \| seller_no_response \| listing_expired` |
| `cancelled_by` | `text` | nullable: `seller \| buyer \| system` |
| `expires_at` | `timestamptz` | set to `authorized_at + 72h` |
| `created_at`, `updated_at` | `timestamptz` | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `reservation_id` | `uuid` FK → `reservations.id` | |
| `stripe_session_id` | `text` | nullable |
| `stripe_intent_id` | `text` | |
| `amount` | `numeric` | |
| `currency` | `text` | |
| `status` | `text` | `pending \| paid \| refunded \| failed` — webhook-driven only |
| `created_at`, `updated_at` | `timestamptz` | |

### `messages`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `reservation_id` | `uuid` FK → `reservations.id` | |
| `sender_id` | `uuid` FK → `profiles.id` | |
| `body` | `text` | |
| `removed_at` | `timestamptz` | nullable; stub shown if removed |
| `created_at` | `timestamptz` | |

### `ratings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `reservation_id` | `uuid` FK → `reservations.id` | UNIQUE |
| `buyer_id` | `uuid` FK → `profiles.id` | |
| `seller_business_id` | `uuid` FK → `seller_business.id` | |
| `score` | `int` | 1–5 |
| `text` | `text` | nullable |
| `removed_at` | `timestamptz` | nullable; admin only |
| `created_at` | `timestamptz` | |

### `reports`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `reporter_id` | `uuid` FK → `profiles.id` | |
| `target_type` | `text` | `listing \| message \| profile \| reservation \| rating` |
| `target_id` | `uuid` | polymorphic |
| `reason` | `text` | |
| `status` | `text` | `open \| reviewed \| resolved \| dismissed` |
| `created_at`, `updated_at` | `timestamptz` | |

### `enforcement_actions`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `admin_id` | `uuid` FK → `profiles.id` | |
| `action_type` | `text` | `hide_listing \| remove_message \| remove_rating \| suspend_user` |
| `target_type`, `target_id` | `text`, `uuid` | |
| `note` | `text` | nullable |
| `created_at` | `timestamptz` | |

### `activity_log`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `actor_id` | `uuid` nullable FK → `profiles.id` | NULL for system events |
| `actor_type` | `text` | `user \| system` |
| `entity_type` | `text` | `profile \| listing \| reservation \| payment \| message \| rating \| report \| enforcement` |
| `entity_id` | `uuid` | |
| `action` | `text` | verb e.g. `created`, `declined`, `expired`, `captured` |
| `metadata` | `jsonb` | snapshot/context data |
| `created_at` | `timestamptz` | set by DB default — append-only, no UPDATE/DELETE |

---

## Activity Log Event Catalogue

| `entity_type` | `action` | `actor_type` | Key `metadata` |
|---|---|---|---|
| `profile` | `signed_up` | `user` | `{ role: 'buyer' }` |
| `profile` | `became_seller` | `user` | `{}` |
| `listing` | `created` | `user` | `{ title, price, quantity }` |
| `listing` | `published` | `user` | `{ seller_business_id }` |
| `listing` | `sold_out` | `system` | `{ triggered_by: reservation_id }` |
| `listing` | `restocked` | `system` | `{ triggered_by: reservation_id, quantity_available }` |
| `listing` | `expired` | `system` | `{ pickup_end, open_reservation_count }` |
| `listing` | `hidden` | `user` | `{ enforcement_action_id }` |
| `listing` | `removed` | `user` | `{ enforcement_action_id }` |
| `reservation` | `created` | `user` | `{ listing_id, price_snapshot }` |
| `reservation` | `authorized` | `system` | `{ stripe_intent_id, expires_at }` |
| `reservation` | `accepted` | `user` | `{}` |
| `reservation` | `declined` | `user` | `{ cancellation_reason }` |
| `reservation` | `cancelled` | `user` | `{ cancellation_reason: 'buyer_cancelled' }` |
| `reservation` | `expired` | `system` | `{ cancellation_reason }` |
| `reservation` | `fulfilled` | `user` | `{}` |
| `payment` | `hold_placed` | `system` | `{ stripe_intent_id, amount, currency }` |
| `payment` | `captured` | `system` | `{ stripe_intent_id, amount }` |
| `payment` | `hold_released` | `system` | `{ stripe_intent_id, reason }` |
| `payment` | `refunded` | `system` | `{ stripe_intent_id, amount }` |
| `message` | `sent` | `user` | `{ reservation_id }` |
| `message` | `removed` | `user` | `{ enforcement_action_id, original_body_hash }` |
| `rating` | `submitted` | `user` | `{ reservation_id, score }` |
| `rating` | `removed` | `user` | `{ enforcement_action_id, score_snapshot }` |
| `report` | `filed` | `user` | `{ target_type, target_id, reason }` |
| `report` | `resolved` | `user` | `{ outcome }` |
| `enforcement` | `user_suspended` | `user` | `{ target_user_id, suspended_until }` |

---

## Relevant Files (to create)
- `app/layout.tsx` — global shell
- `app/page.tsx` — landing page
- `app/listings/page.tsx`, `app/listings/[id]/page.tsx`
- `app/seller/listings/page.tsx`, `app/seller/listings/new/page.tsx`, `app/seller/listings/[id]/edit/page.tsx`
- `app/seller/reservations/page.tsx`, `app/seller/reservations/[id]/page.tsx`
- `app/reservations/page.tsx`, `app/reservations/[id]/page.tsx`
- `app/admin/page.tsx`, `app/admin/activity-log/page.tsx`
- `app/auth/callback/route.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/supabase/browser.ts`, `lib/supabase/server.ts`
- `lib/types/database.ts`
- `middleware.ts`
- `supabase/migrations/*.sql`

---

## Verification Checklist
1. Auth: sign up (default buyer role), sign in with Google, sign in with email/password, protected routes redirect correctly
2. Listings: seller creates listing with location → visible on /listings, distance filter works
3. Reservation: buyer applies → card held → `authorized`; `quantity_available` decrements; listing → `sold_out` at zero
4. Payment capture: seller accepts → Stripe captures → webhook → `paid`
5. Decline: seller declines with reason → hold released → `declined`; reason visible to buyer
6. Expiry: 72h passes without seller response → cron cancels Stripe intent → `expired`; quantity restored
7. Listing expiry: `pickup_end` passes → listing → `expired`; all authorized reservations cancelled
8. Fulfill + rate: seller marks fulfilled → buyer sees rating form → submits 1–5 star rating
9. Chat: real-time message delivery between buyer and seller on same reservation
10. Admin: file report → triage → enforce → confirm activity log entry written
11. RLS: buyer cannot read another buyer's reservations via Supabase client
12. Netlify deploy: production build succeeds, Stripe webhook signature verified
