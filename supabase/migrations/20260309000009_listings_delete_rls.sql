-- Sellers can hard-delete their own draft listings.
-- Active / sold_out / expired / removed listings are protected — only admins can delete those.
CREATE POLICY "listings: seller delete draft"
  ON public.listings FOR DELETE
  TO authenticated
  USING (
    status = 'draft'
    AND seller_business_id IN (
      SELECT id FROM public.seller_business WHERE owner_id = auth.uid()
    )
  );

-- Admins can delete any listing.
CREATE POLICY "listings: admin delete"
  ON public.listings FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));
