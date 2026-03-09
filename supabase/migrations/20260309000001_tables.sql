-- =============================================================
-- NeighborGoods — Migration 001: Core Tables
-- =============================================================
-- Run order: 1 of 5
-- Run this first in the Supabase SQL Editor.
-- =============================================================

-- -------------------------------------------------------------
-- EXTENSIONS
-- -------------------------------------------------------------
-- PostGIS: spatial distance queries for nearby listings
CREATE EXTENSION IF NOT EXISTS postgis;

-- pg_cron: scheduled jobs (expiry handling) — enable in Dashboard
-- Database → Extensions → pg_cron
-- CREATE EXTENSION IF NOT EXISTS pg_cron;


-- =============================================================
-- PROFILES
-- Mirrors auth.users. Auto-created on sign-up via trigger.
-- is_admin is a DBA-only allowlist — NEVER set via client code.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    text,
  phone           text,
  is_seller       boolean     NOT NULL DEFAULT false,
  is_admin        boolean     NOT NULL DEFAULT false,
  suspended_until timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.profiles IS 'User profiles; mirrors auth.users. is_admin is an allowlist — set manually by DBA only.';
COMMENT ON COLUMN public.profiles.is_admin IS 'True only for admins. Never updated via client RLS policy.';


-- =============================================================
-- SELLER_BUSINESS
-- One record per seller (UNIQUE on owner_id).
-- lat/lng required before a listing can be published.
-- location (PostGIS geography) is kept in sync by trigger.
-- plus_code is derived and stored by the application layer.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.seller_business (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name text        NOT NULL,
  address_line  text,
  city          text,
  province      text,
  postal_code   text,
  lat           float8,
  lng           float8,
  location      geography(Point, 4326),   -- kept in sync by trg_sync_seller_location
  plus_code     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.seller_business.location IS 'PostGIS geography derived from (lng, lat). Used for ST_DWithin distance queries. Maintained by trigger.';


-- =============================================================
-- LISTINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS public.listings (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_business_id uuid          NOT NULL REFERENCES public.seller_business(id) ON DELETE CASCADE,
  title              text          NOT NULL,
  description        text,
  category           text,
  price              numeric(12,2) NOT NULL CHECK (price >= 0),
  currency           text          NOT NULL DEFAULT 'PHP',
  quantity           int           NOT NULL CHECK (quantity > 0),
  quantity_available int           NOT NULL,
  pickup_start       timestamptz,
  pickup_end         timestamptz,
  status             text          NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'sold_out', 'expired', 'removed')),
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT chk_quantity_available_non_negative CHECK (quantity_available >= 0),
  CONSTRAINT chk_quantity_available_not_exceed   CHECK (quantity_available <= quantity)
);


-- =============================================================
-- LISTING_PHOTOS
-- storage_path is the path inside the listing-photos bucket.
-- sort_order controls display order.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.listing_photos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0
);


-- =============================================================
-- RESERVATIONS
-- quantity_available on listings is managed by triggers on
-- INSERT (decrement) and on status UPDATE to terminal states
-- (restore).
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reservations (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          uuid          NOT NULL REFERENCES public.listings(id),
  buyer_id            uuid          NOT NULL REFERENCES public.profiles(id),
  price_snapshot      numeric(12,2) NOT NULL,
  currency            text          NOT NULL,
  status              text          NOT NULL DEFAULT 'pending_authorization'
    CHECK (status IN (
      'pending_authorization', 'authorized', 'accepted',
      'paid', 'fulfilled', 'declined', 'cancelled', 'expired', 'refunded'
    )),
  cancellation_reason text
    CHECK (cancellation_reason IN (
      'no_stock', 'wrong_item', 'pickup_not_possible', 'other',
      'buyer_cancelled', 'seller_no_response', 'listing_expired'
    )),
  cancelled_by        text CHECK (cancelled_by IN ('seller', 'buyer', 'system')),
  expires_at          timestamptz,
  created_at          timestamptz   NOT NULL DEFAULT now(),
  updated_at          timestamptz   NOT NULL DEFAULT now()
);


-- =============================================================
-- PAYMENTS
-- Managed exclusively by the server-side Stripe webhook handler.
-- Client code has no INSERT/UPDATE access via RLS.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id    uuid          NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  stripe_session_id text,
  stripe_intent_id  text          NOT NULL,
  amount            numeric(12,2) NOT NULL,
  currency          text          NOT NULL,
  status            text          NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'refunded', 'failed')),
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);


-- =============================================================
-- MESSAGES
-- Scoped to a single reservation. removed_at is set by admin
-- enforcement; the app renders a stub when it is not NULL.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid        NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  sender_id      uuid        NOT NULL REFERENCES public.profiles(id),
  body           text        NOT NULL,
  removed_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);


-- =============================================================
-- RATINGS
-- One rating per fulfilled reservation (UNIQUE on reservation_id).
-- removed_at is set by admin enforcement only.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id     uuid NOT NULL UNIQUE REFERENCES public.reservations(id) ON DELETE CASCADE,
  buyer_id           uuid NOT NULL REFERENCES public.profiles(id),
  seller_business_id uuid NOT NULL REFERENCES public.seller_business(id),
  score              int  NOT NULL CHECK (score BETWEEN 1 AND 5),
  text               text,
  removed_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);


-- =============================================================
-- REPORTS
-- Polymorphic: target_type + target_id point to any entity.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid        NOT NULL REFERENCES public.profiles(id),
  target_type text        NOT NULL
    CHECK (target_type IN ('listing', 'message', 'profile', 'reservation', 'rating')),
  target_id   uuid        NOT NULL,
  reason      text        NOT NULL,
  status      text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'reviewed', 'resolved', 'dismissed')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);


-- =============================================================
-- ENFORCEMENT_ACTIONS
-- Admin-only. Treated as immutable after creation.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.enforcement_actions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid NOT NULL REFERENCES public.profiles(id),
  action_type text NOT NULL
    CHECK (action_type IN ('hide_listing', 'remove_message', 'remove_rating', 'suspend_user')),
  target_type text NOT NULL,
  target_id   uuid NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- =============================================================
-- ACTIVITY_LOG  (append-only audit trail)
-- actor_id is NULL for system-generated events.
-- RLS in migration 003 blocks UPDATE and DELETE entirely.
-- =============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_type  text NOT NULL CHECK (actor_type IN ('user', 'system')),
  entity_type text NOT NULL
    CHECK (entity_type IN (
      'profile', 'listing', 'reservation', 'payment',
      'message', 'rating', 'report', 'enforcement'
    )),
  entity_id   uuid NOT NULL,
  action      text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.activity_log IS 'Append-only audit trail. RLS prevents any UPDATE or DELETE.';


-- =============================================================
-- REALTIME
-- Enable live subscriptions for chat and reservation status.
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;


-- =============================================================
-- STORAGE — listing-photos bucket
-- Files are stored at: {owner_uid}/{listing_id}/{filename}
-- =============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;
