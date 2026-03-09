-- =============================================================
-- NeighborGoods — Migration 004: Indexes
-- =============================================================
-- Run order: 4 of 5
-- Depends on: 20260309000001_tables.sql
-- =============================================================


-- =============================================================
-- SELLER_BUSINESS
-- =============================================================

-- GiST spatial index on the PostGIS geography column.
-- Powers ST_DWithin distance queries for the listings feed.
CREATE INDEX idx_seller_business_location
  ON public.seller_business USING GIST (location)
  WHERE location IS NOT NULL;

-- Bounding-box pre-filter on raw lat/lng (complementary to GiST).
CREATE INDEX idx_seller_business_lat_lng
  ON public.seller_business (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;


-- =============================================================
-- LISTINGS
-- =============================================================

-- Feed: filter by status (most queries hit status = 'active').
CREATE INDEX idx_listings_status
  ON public.listings (status);

-- Seller dashboard: all listings for a seller_business.
CREATE INDEX idx_listings_seller_business_id
  ON public.listings (seller_business_id);

-- Expiry cron: find listings whose pickup window has ended.
CREATE INDEX idx_listings_pickup_end
  ON public.listings (pickup_end)
  WHERE status IN ('active', 'sold_out');

-- Feed filter: category on active listings.
CREATE INDEX idx_listings_category_active
  ON public.listings (category)
  WHERE status = 'active';


-- =============================================================
-- RESERVATIONS
-- =============================================================

-- Buyer reservation list page.
CREATE INDEX idx_reservations_buyer_id
  ON public.reservations (buyer_id);

-- Seller dashboard + quantity trigger lookup.
CREATE INDEX idx_reservations_listing_id
  ON public.reservations (listing_id);

-- Expiry cron: find stale authorized / pending reservations.
CREATE INDEX idx_reservations_expiry
  ON public.reservations (status, expires_at)
  WHERE status IN ('authorized', 'pending_authorization');


-- =============================================================
-- MESSAGES
-- =============================================================

-- Chat display: all messages for a reservation, in order.
CREATE INDEX idx_messages_reservation_id_created
  ON public.messages (reservation_id, created_at);


-- =============================================================
-- RATINGS
-- =============================================================

-- Seller rating aggregation (average score, count).
CREATE INDEX idx_ratings_seller_business_id
  ON public.ratings (seller_business_id)
  WHERE removed_at IS NULL;


-- =============================================================
-- PAYMENTS
-- =============================================================

-- Lookup payment by reservation (webhook handler).
CREATE INDEX idx_payments_reservation_id
  ON public.payments (reservation_id);

-- Stripe webhook lookup by intent ID.
CREATE INDEX idx_payments_stripe_intent_id
  ON public.payments (stripe_intent_id);


-- =============================================================
-- REPORTS
-- =============================================================

-- Admin triage queue by status.
CREATE INDEX idx_reports_status
  ON public.reports (status);

-- Reporter view: find own reports.
CREATE INDEX idx_reports_reporter_id
  ON public.reports (reporter_id);


-- =============================================================
-- ACTIVITY_LOG
-- =============================================================

-- Admin audit filter: by entity type + ID.
CREATE INDEX idx_activity_log_entity
  ON public.activity_log (entity_type, entity_id);

-- Actor history (user or system event lookup).
CREATE INDEX idx_activity_log_actor_id
  ON public.activity_log (actor_id)
  WHERE actor_id IS NOT NULL;

-- Date-range filter in the admin log viewer.
CREATE INDEX idx_activity_log_created_at
  ON public.activity_log (created_at DESC);
