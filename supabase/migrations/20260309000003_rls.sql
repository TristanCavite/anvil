-- =============================================================
-- NeighborGoods — Migration 003: Row Level Security Policies
-- =============================================================
-- Run order: 3 of 5
-- Depends on: 20260309000001_tables.sql
--             20260309000002_functions_triggers.sql  (is_admin())
-- =============================================================
-- Design notes:
--   • Permissive policies on the same table/operation are OR-ed.
--   • The service role (used server-side) bypasses RLS entirely.
--     This covers: Stripe webhook writes, system cron updates,
--     admin enforcement Edge Functions.
--   • is_admin() uses SECURITY DEFINER to avoid a recursive
--     profile lookup when evaluating policies.
-- =============================================================


-- =============================================================
-- PROFILES
-- =============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read any profile.
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update only their own profile. Two protected fields:
--   • is_admin  — DBA-only; never changed via client
--   • suspended_until — admin-only; users cannot lift their own ban
CREATE POLICY "profiles: owner update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
    AND (suspended_until IS NOT DISTINCT FROM
         (SELECT suspended_until FROM public.profiles WHERE id = auth.uid()))
  );

-- Admins can update any profile (suspension, etc.).
CREATE POLICY "profiles: admin update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- SELLER_BUSINESS
-- =============================================================
ALTER TABLE public.seller_business ENABLE ROW LEVEL SECURITY;

-- Public read — needed to show seller info on listing detail page.
CREATE POLICY "seller_business: public read"
  ON public.seller_business FOR SELECT
  USING (true);

-- Only profiles with is_seller = true can create a business.
CREATE POLICY "seller_business: owner insert"
  ON public.seller_business FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (SELECT is_seller FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Owner can update their own business (location, name, etc.).
CREATE POLICY "seller_business: owner update"
  ON public.seller_business FOR UPDATE
  TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());


-- =============================================================
-- LISTINGS
-- Three SELECT policies combine with OR so sellers see all
-- their own listings while the public only sees active ones.
-- =============================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Public can read active listings (the main browsing feed).
CREATE POLICY "listings: public read active"
  ON public.listings FOR SELECT
  USING (status = 'active');

-- Sellers can read all their own listings (any status, for dashboard).
CREATE POLICY "listings: seller read own"
  ON public.listings FOR SELECT
  TO authenticated
  USING (
    seller_business_id IN (
      SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
    )
  );

-- Admins can read every listing regardless of status.
CREATE POLICY "listings: admin read all"
  ON public.listings FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Sellers can create listings for their own seller_business.
CREATE POLICY "listings: seller insert"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_business_id IN (
      SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
    )
    AND (SELECT is_seller FROM public.profiles WHERE id = auth.uid()) = true
    AND status = 'draft'  -- new listings must start as draft
  );

-- Sellers can update their own listings (except ones already removed).
CREATE POLICY "listings: seller update own"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    seller_business_id IN (
      SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
    )
    AND status != 'removed'
  )
  WITH CHECK (
    seller_business_id IN (
      SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
    )
  );

-- Admins can update any listing (hide / remove enforcement).
CREATE POLICY "listings: admin update"
  ON public.listings FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- LISTING_PHOTOS
-- Photos are not sensitive; public reads are fine.
-- Sellers manage photos only for their own listings.
-- =============================================================
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read any photo row (bucket is public anyway).
CREATE POLICY "listing_photos: public read"
  ON public.listing_photos FOR SELECT
  USING (true);

-- Sellers can add photos to their own listings.
CREATE POLICY "listing_photos: seller insert"
  ON public.listing_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.seller_business_id IN (
          SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
        )
    )
  );

-- Sellers can reorder photos on their own listings.
CREATE POLICY "listing_photos: seller update"
  ON public.listing_photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.seller_business_id IN (
          SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
        )
    )
  );

-- Sellers can delete photos from their own listings.
CREATE POLICY "listing_photos: seller delete"
  ON public.listing_photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
        AND l.seller_business_id IN (
          SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
        )
    )
  );


-- =============================================================
-- RESERVATIONS
-- =============================================================
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Buyers can read their own reservations.
CREATE POLICY "reservations: buyer read own"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Sellers can read reservations placed against their listings.
CREATE POLICY "reservations: seller read own listings"
  ON public.reservations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_business sb ON l.seller_business_id = sb.id
      WHERE l.id = listing_id
        AND sb.owner_id = auth.uid()
    )
  );

-- Admins can read all reservations.
CREATE POLICY "reservations: admin read all"
  ON public.reservations FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Authenticated buyers can create a reservation.
-- Guards: must be the buyer, must not be reserving their own listing,
--         and the initial status must be pending_authorization.
CREATE POLICY "reservations: buyer insert"
  ON public.reservations FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND status = 'pending_authorization'
    AND NOT EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_business sb ON l.seller_business_id = sb.id
      WHERE l.id = listing_id
        AND sb.owner_id = auth.uid()
    )
  );

-- Buyers can self-cancel while the reservation is authorized.
-- Full lifecycle transitions (authorized, accepted, paid, etc.)
-- are handled server-side via the service role.
CREATE POLICY "reservations: buyer cancel"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid()
    AND status = 'authorized'
  )
  WITH CHECK (
    buyer_id = auth.uid()
    AND status = 'cancelled'
    AND cancellation_reason = 'buyer_cancelled'
    AND cancelled_by = 'buyer'
  );

-- Sellers can accept, decline, or mark reservations as fulfilled.
CREATE POLICY "reservations: seller update"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_business sb ON l.seller_business_id = sb.id
      WHERE l.id = listing_id
        AND sb.owner_id = auth.uid()
    )
    AND status IN ('authorized', 'accepted', 'paid')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_business sb ON l.seller_business_id = sb.id
      WHERE l.id = listing_id
        AND sb.owner_id = auth.uid()
    )
  );

-- Admins can update any reservation.
CREATE POLICY "reservations: admin update"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- PAYMENTS
-- No client INSERT/UPDATE — all writes via service role only.
-- =============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Buyers can read payments linked to their reservations.
CREATE POLICY "payments: buyer read own"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND r.buyer_id = auth.uid()
    )
  );

-- Sellers can read payments for reservations on their listings.
CREATE POLICY "payments: seller read own"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      JOIN public.listings l ON l.id = r.listing_id
      JOIN public.seller_business sb ON sb.id = l.seller_business_id
      WHERE r.id = reservation_id
        AND sb.owner_id = auth.uid()
    )
  );

-- Admins can read all payment records.
CREATE POLICY "payments: admin read all"
  ON public.payments FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));


-- =============================================================
-- MESSAGES
-- =============================================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only reservation participants (buyer + listing's seller) can read.
CREATE POLICY "messages: participant read"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND (
          r.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.listings l
            JOIN public.seller_business sb ON l.seller_business_id = sb.id
            WHERE l.id = r.listing_id
              AND sb.owner_id = auth.uid()
          )
        )
    )
  );

-- Only reservation participants can send messages.
CREATE POLICY "messages: participant insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND (
          r.buyer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.listings l
            JOIN public.seller_business sb ON l.seller_business_id = sb.id
            WHERE l.id = r.listing_id
              AND sb.owner_id = auth.uid()
          )
        )
    )
  );

-- Admins can set removed_at for content moderation.
CREATE POLICY "messages: admin update"
  ON public.messages FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- RATINGS
-- =============================================================
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can read ratings that have not been removed.
CREATE POLICY "ratings: public read"
  ON public.ratings FOR SELECT
  USING (removed_at IS NULL);

-- The buyer who authored the rating can always see it (even if removed).
CREATE POLICY "ratings: buyer read own"
  ON public.ratings FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

-- Admins see all rating rows.
CREATE POLICY "ratings: admin read all"
  ON public.ratings FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Buyers can submit a rating only for their own fulfilled reservation
-- that has not yet been rated (UNIQUE constraint handles duplicates).
CREATE POLICY "ratings: buyer insert"
  ON public.ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    buyer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND r.buyer_id = auth.uid()
        AND r.status = 'fulfilled'
    )
  );

-- Admins can set removed_at (soft-delete for content moderation).
CREATE POLICY "ratings: admin update"
  ON public.ratings FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- REPORTS
-- =============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reporters see only their own; admins see everything.
CREATE POLICY "reports: read own or admin"
  ON public.reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid() OR (SELECT public.is_admin()));

-- Any authenticated user can file a report.
CREATE POLICY "reports: authenticated insert"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Admins triage, resolve, or dismiss reports.
CREATE POLICY "reports: admin update"
  ON public.reports FOR UPDATE
  TO authenticated
  USING  ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));


-- =============================================================
-- ENFORCEMENT_ACTIONS
-- Admin-only table. No client access.
-- =============================================================
ALTER TABLE public.enforcement_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enforcement_actions: admin read"
  ON public.enforcement_actions FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

CREATE POLICY "enforcement_actions: admin insert"
  ON public.enforcement_actions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

-- No UPDATE or DELETE policies — records are immutable once created.


-- =============================================================
-- ACTIVITY_LOG — append-only audit trail
-- No UPDATE or DELETE policies exist → blocked for all roles
-- via RLS. The service role (server-side) bypasses RLS and
-- can insert system events (actor_type = 'system').
-- =============================================================
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Admins can read the full audit trail.
CREATE POLICY "activity_log: admin read all"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Users can read their own activity log entries.
CREATE POLICY "activity_log: user read own"
  ON public.activity_log FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

-- Authenticated users can append their own user events.
-- System events (actor_type = 'system') are written server-side.
CREATE POLICY "activity_log: user insert own"
  ON public.activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_type = 'user'
    AND actor_id = auth.uid()
  );

-- UPDATE and DELETE are intentionally absent — append-only by design.


-- =============================================================
-- STORAGE — listing-photos bucket policies
-- Files path convention: {owner_uid}/{listing_id}/{filename}
-- =============================================================

-- Public bucket: anyone can read files.
CREATE POLICY "storage listing_photos: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

-- Sellers can upload files into their own uid-prefixed folder.
CREATE POLICY "storage listing_photos: seller upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (SELECT is_seller FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Sellers can replace (update) files in their own folder.
CREATE POLICY "storage listing_photos: seller update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Sellers can delete files from their own folder.
CREATE POLICY "storage listing_photos: seller delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
