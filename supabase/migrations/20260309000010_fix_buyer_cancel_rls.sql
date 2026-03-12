-- Fix buyer cancel policy to also allow cancelling pending_authorization reservations.
-- The previous policy only permitted cancellation from 'authorized' status.
DROP POLICY IF EXISTS "reservations: buyer cancel" ON public.reservations;

CREATE POLICY "reservations: buyer cancel"
  ON public.reservations FOR UPDATE
  TO authenticated
  USING (
    buyer_id = auth.uid()
    AND status IN ('pending_authorization', 'authorized')
  )
  WITH CHECK (
    buyer_id = auth.uid()
    AND status = 'cancelled'
    AND cancellation_reason = 'buyer_cancelled'
    AND cancelled_by = 'buyer'
  );
