-- =============================================================
-- NeighborGoods — Migration 011: Seller review for pending reservations
-- =============================================================
-- Allows sellers to review newly created reservations while they are
-- still in pending_authorization, before moving them to accepted or
-- declining them back to stock.
-- =============================================================

DROP POLICY IF EXISTS "reservations: seller update" ON public.reservations;

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
    AND status IN ('pending_authorization', 'authorized', 'accepted', 'paid')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.seller_business sb ON l.seller_business_id = sb.id
      WHERE l.id = listing_id
        AND sb.owner_id = auth.uid()
    )
  );