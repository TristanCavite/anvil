-- =============================================================
-- NeighborGoods — Migration 005: Expiry Handling & Cron Schedule
-- =============================================================
-- Run order: 5 of 5
-- Depends on: 20260309000001_tables.sql
--             20260309000002_functions_triggers.sql
-- =============================================================
-- IMPORTANT — Before running this file:
--   1. Enable pg_cron in the Supabase Dashboard:
--      Database → Extensions → search "pg_cron" → Enable
--   2. Run the cron.schedule() call at the bottom of this file
--      in the SQL Editor AFTER the extension is enabled.
--
-- NOTE: This function updates database state only.
-- Stripe payment intent cancellation (for expired reservations)
-- must be handled separately via a Supabase Database Webhook that
-- watches for reservations.status = 'expired' and triggers an
-- Edge Function to call stripe.paymentIntents.cancel().
-- =============================================================


-- =============================================================
-- FUNCTION: expire_stale_reservations()
-- Handles three expiry scenarios every run:
--
--   1. authorized reservations past their 72-hour expires_at
--      → status: expired, reason: seller_no_response
--
--   2. pending_authorization reservations abandoned > 30 min
--      (buyer never completed Stripe card entry)
--      → status: expired, reason: other
--
--   3. listings whose pickup_end has passed (still active/sold_out)
--      → cancel all open reservations with reason: listing_expired
--      → set listing status: expired
--
-- The restore_listing_quantity trigger fires automatically on
-- each reservation status update to 'expired', so quantity_available
-- is restored and listings flip back from sold_out → active as needed
-- (unless the listing itself is being expired in scenario 3).
-- =============================================================
CREATE OR REPLACE FUNCTION public.expire_stale_reservations()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_reservation RECORD;
  v_listing     RECORD;
BEGIN

  -- -----------------------------------------------------------
  -- Scenario 1: authorized reservations past their expires_at
  -- -----------------------------------------------------------
  FOR v_reservation IN
    SELECT id, listing_id
    FROM public.reservations
    WHERE status = 'authorized'
      AND expires_at IS NOT NULL
      AND expires_at < now()
  LOOP
    UPDATE public.reservations
    SET
      status              = 'expired',
      cancellation_reason = 'seller_no_response',
      cancelled_by        = 'system'
    WHERE id = v_reservation.id;
    -- restore_listing_quantity trigger fires automatically above.

    INSERT INTO public.activity_log
      (actor_id, actor_type, entity_type, entity_id, action, metadata)
    VALUES (
      NULL, 'system', 'reservation', v_reservation.id, 'expired',
      jsonb_build_object('cancellation_reason', 'seller_no_response')
    );
  END LOOP;

  -- -----------------------------------------------------------
  -- Scenario 2: abandoned pending_authorization (> 30 min)
  -- Buyer opened the payment flow but never completed it.
  -- -----------------------------------------------------------
  FOR v_reservation IN
    SELECT id, listing_id
    FROM public.reservations
    WHERE status = 'pending_authorization'
      AND created_at < now() - interval '30 minutes'
  LOOP
    UPDATE public.reservations
    SET
      status              = 'expired',
      cancellation_reason = 'other',
      cancelled_by        = 'system'
    WHERE id = v_reservation.id;
    -- restore_listing_quantity trigger fires automatically above.

    INSERT INTO public.activity_log
      (actor_id, actor_type, entity_type, entity_id, action, metadata)
    VALUES (
      NULL, 'system', 'reservation', v_reservation.id, 'expired',
      jsonb_build_object('cancellation_reason', 'payment_abandoned')
    );
  END LOOP;

  -- -----------------------------------------------------------
  -- Scenario 3: listings whose pickup window has ended
  -- Cancel all still-open reservations first, then expire listing.
  -- -----------------------------------------------------------
  FOR v_listing IN
    SELECT id, pickup_end
    FROM public.listings
    WHERE status IN ('active', 'sold_out')
      AND pickup_end IS NOT NULL
      AND pickup_end < now()
  LOOP
    -- Cancel every open reservation on this listing
    FOR v_reservation IN
      SELECT id
      FROM public.reservations
      WHERE listing_id = v_listing.id
        AND status IN ('authorized', 'pending_authorization')
    LOOP
      UPDATE public.reservations
      SET
        status              = 'expired',
        cancellation_reason = 'listing_expired',
        cancelled_by        = 'system'
      WHERE id = v_reservation.id;
      -- restore_listing_quantity trigger fires (but listing will be
      -- expired right after, so the active/sold_out flip is harmless).

      INSERT INTO public.activity_log
        (actor_id, actor_type, entity_type, entity_id, action, metadata)
      VALUES (
        NULL, 'system', 'reservation', v_reservation.id, 'expired',
        jsonb_build_object('cancellation_reason', 'listing_expired')
      );
    END LOOP;

    -- Expire the listing itself
    UPDATE public.listings
    SET status = 'expired'
    WHERE id = v_listing.id;

    INSERT INTO public.activity_log
      (actor_id, actor_type, entity_type, entity_id, action, metadata)
    VALUES (
      NULL, 'system', 'listing', v_listing.id, 'expired',
      jsonb_build_object('pickup_end', v_listing.pickup_end::text)
    );
  END LOOP;

END;
$$;


-- =============================================================
-- CRON SCHEDULE
-- =============================================================
-- Enable pg_cron first (Database → Extensions → pg_cron),
-- then run the SELECT below in the SQL Editor.
--
-- Schedule: every 15 minutes
-- Job name: 'neighborgoods-expiry'
-- =============================================================

-- Run once after enabling pg_cron:
SELECT cron.schedule(
  'neighborgoods-expiry',
  '*/15 * * * *',
  'SELECT public.expire_stale_reservations()'
);

-- To confirm the job was registered:
-- SELECT jobid, jobname, schedule, command FROM cron.job;

-- To remove the schedule if needed:
-- SELECT cron.unschedule('neighborgoods-expiry');
