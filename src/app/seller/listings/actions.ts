'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from 'lib/supabase/server'

export async function deleteDraftListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Fetch listing + photos, verifying it belongs to this user's business
  const { data: listing, error: fetchErr } = await supabase
    .from('listings')
    .select(`
      id,
      status,
      seller_business_id,
      listing_photos ( storage_path )
    `)
    .eq('id', listingId)
    .single()

  if (fetchErr || !listing) throw new Error('Listing not found')

  // Verify the seller_business belongs to the calling user
  const { data: biz } = await supabase
    .from('seller_business')
    .select('id')
    .eq('id', listing.seller_business_id)
    .eq('owner_id', user.id)
    .single()

  if (!biz) throw new Error('Not authorized')

  // Safety: only draft listings can be hard-deleted by the seller
  if (listing.status !== 'draft') throw new Error('Only draft listings can be deleted')

  // Remove all photo files from storage (best-effort — don't abort if some fail)
  const paths = (listing.listing_photos as { storage_path: string }[])
    .map(p => p.storage_path)
    .filter(Boolean)

  if (paths.length > 0) {
    await supabase.storage.from('listing-photos').remove(paths)
  }

  // Delete the listing row — listing_photos cascade via FK
  const { error: deleteErr } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)

  if (deleteErr) throw new Error(deleteErr.message)

  revalidatePath('/seller/listings')
}
