-- =============================================================
-- NeighborGoods — Migration 002: Functions & Triggers
-- =============================================================
-- Run order: 2 of 5
-- Depends on: 20260309000001_tables.sql
-- =============================================================


-- =============================================================
-- HELPER: is_admin()
-- Used inside RLS policies to check admin status without a
-- recursive self-join on profiles. SECURITY DEFINER lets it
-- bypass RLS when reading the profiles table.
-- =============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  )
$$;


-- =============================================================
-- TRIGGER FUNCTION: set_updated_at()
-- Keeps updated_at current on every row modification.
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_seller_business_updated_at
  BEFORE UPDATE ON public.seller_business
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- TRIGGER FUNCTION: handle_new_user()
-- Auto-creates a profiles row whenever a new auth.users row is
-- inserted (any provider: Google, email/password, etc.).
-- SECURITY DEFINER is required to bypass RLS on profiles.
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =============================================================
-- TRIGGER FUNCTION: sync_seller_location()
-- Keeps the PostGIS geography column in sync whenever lat or
-- lng is written. Runs BEFORE INSERT OR UPDATE so the derived
-- value is included in the same write.
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_seller_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_seller_location
  BEFORE INSERT OR UPDATE OF lat, lng ON public.seller_business
  FOR EACH ROW EXECUTE FUNCTION public.sync_seller_location();


-- =============================================================
-- TRIGGER FUNCTION: decrement_listing_quantity()
-- Fires AFTER a reservation is inserted with status
-- 'pending_authorization'. Decrements quantity_available and
-- flips the listing to sold_out when it reaches zero.
-- Raises an exception (rolling back the INSERT) if no stock
-- is available on the active listing.
-- SECURITY DEFINER is required to update listings under RLS.
-- =============================================================
CREATE OR REPLACE FUNCTION public.decrement_listing_quantity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_qty int;
BEGIN
  UPDATE public.listings
  SET
    quantity_available = quantity_available - 1,
    status = CASE
      WHEN quantity_available - 1 = 0 THEN 'sold_out'
      ELSE status
    END
  WHERE id = NEW.listing_id
    AND status = 'active'
    AND quantity_available > 0
  RETURNING quantity_available INTO v_new_qty;

  IF v_new_qty IS NULL THEN
    RAISE EXCEPTION 'listing_not_available'
      USING HINT = 'The listing is not active or has no available quantity.';
  END IF;

  RETURN NEW;
END;
$$;

-- Only fires for newly inserted reservations (always starts at pending_authorization).
CREATE TRIGGER trg_decrement_quantity_on_reservation
  AFTER INSERT ON public.reservations
  FOR EACH ROW
  WHEN (NEW.status = 'pending_authorization')
  EXECUTE FUNCTION public.decrement_listing_quantity();


-- =============================================================
-- TRIGGER FUNCTION: restore_listing_quantity()
-- Fires AFTER a reservation status transitions to a terminal
-- cancelled state (declined / cancelled / expired).
-- Restores quantity_available by 1 and reverts the listing
-- from sold_out → active when stock becomes available again.
-- Guard on OLD.status prevents double-restores if a terminal
-- status is somehow written twice.
-- SECURITY DEFINER is required to update listings under RLS.
-- =============================================================
CREATE OR REPLACE FUNCTION public.restore_listing_quantity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only act when first entering a terminal cancelled state
  IF NEW.status IN ('declined', 'cancelled', 'expired')
    AND OLD.status NOT IN ('declined', 'cancelled', 'expired', 'fulfilled', 'refunded')
  THEN
    UPDATE public.listings
    SET
      quantity_available = quantity_available + 1,
      -- Revive listing only if it was sold_out; expired/removed stay as-is
      status = CASE
        WHEN status = 'sold_out' AND (quantity_available + 1) > 0 THEN 'active'
        ELSE status
      END
    WHERE id = NEW.listing_id
      AND status IN ('active', 'sold_out');
  END IF;

  RETURN NEW;
END;
$$;

-- Fires on any status update so it catches all transition paths.
CREATE TRIGGER trg_restore_quantity_on_cancellation
  AFTER UPDATE OF status ON public.reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_listing_quantity();
