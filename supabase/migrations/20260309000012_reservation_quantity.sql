-- =============================================================
-- NeighborGoods — Migration 012: Reservation quantities
-- =============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS quantity int NOT NULL DEFAULT 1
  CHECK (quantity > 0);

COMMENT ON COLUMN public.reservations.quantity IS 'Number of units held by the reservation.';

CREATE OR REPLACE FUNCTION public.decrement_listing_quantity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_qty int;
BEGIN
  UPDATE public.listings
  SET
    quantity_available = quantity_available - NEW.quantity,
    status = CASE
      WHEN quantity_available - NEW.quantity = 0 THEN 'sold_out'
      ELSE status
    END
  WHERE id = NEW.listing_id
    AND status = 'active'
    AND quantity_available >= NEW.quantity
  RETURNING quantity_available INTO v_new_qty;

  IF v_new_qty IS NULL THEN
    RAISE EXCEPTION 'listing_not_available'
      USING HINT = 'The listing is not active or has no available quantity.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_listing_quantity_on_reservation_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_delta int;
  v_new_qty int;
BEGIN
  v_delta := NEW.quantity - OLD.quantity;

  IF v_delta = 0 THEN
    RETURN NEW;
  END IF;

  IF NEW.status NOT IN ('pending_authorization', 'authorized', 'accepted', 'paid') THEN
    RAISE EXCEPTION 'reservation_quantity_locked'
      USING HINT = 'Reservation quantity can only change while the reservation is active.';
  END IF;

  IF v_delta > 0 THEN
    UPDATE public.listings
    SET
      quantity_available = quantity_available - v_delta,
      status = CASE
        WHEN quantity_available - v_delta = 0 THEN 'sold_out'
        ELSE status
      END
    WHERE id = NEW.listing_id
      AND status IN ('active', 'sold_out')
      AND quantity_available >= v_delta
    RETURNING quantity_available INTO v_new_qty;
  ELSE
    UPDATE public.listings
    SET
      quantity_available = quantity_available + ABS(v_delta),
      status = CASE
        WHEN status = 'sold_out' AND (quantity_available + ABS(v_delta)) > 0 THEN 'active'
        ELSE status
      END
    WHERE id = NEW.listing_id
      AND status IN ('active', 'sold_out')
    RETURNING quantity_available INTO v_new_qty;
  END IF;

  IF v_new_qty IS NULL THEN
    RAISE EXCEPTION 'listing_not_available'
      USING HINT = 'The listing does not have enough available quantity for that change.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_quantity_on_reservation_update ON public.reservations;
CREATE TRIGGER trg_adjust_quantity_on_reservation_update
  AFTER UPDATE OF quantity ON public.reservations
  FOR EACH ROW
  WHEN (NEW.quantity IS DISTINCT FROM OLD.quantity)
  EXECUTE FUNCTION public.adjust_listing_quantity_on_reservation_update();

CREATE OR REPLACE FUNCTION public.restore_listing_quantity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('declined', 'cancelled', 'expired')
    AND OLD.status NOT IN ('declined', 'cancelled', 'expired', 'fulfilled', 'refunded')
  THEN
    UPDATE public.listings
    SET
      quantity_available = quantity_available + OLD.quantity,
      status = CASE
        WHEN status = 'sold_out' AND (quantity_available + OLD.quantity) > 0 THEN 'active'
        ELSE status
      END
    WHERE id = NEW.listing_id
      AND status IN ('active', 'sold_out');
  END IF;

  RETURN NEW;
END;
$$;