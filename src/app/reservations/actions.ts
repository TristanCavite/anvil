'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from 'lib/supabase/server'
import { createAdminClient } from 'lib/supabase/admin'

// ─── Buyer: create a reservation ─────────────────────────────────────────────
export async function createReservation(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to reserve items.')

  // Fetch listing price snapshot — also confirms it's active
  const { data: listing } = await supabase
    .from('listings')
    .select('id, price, currency, quantity_available, status')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (!listing) throw new Error('This listing is no longer available.')
  if (listing.quantity_available <= 0) throw new Error('This item is sold out.')

  // Check buyer hasn't already reserved this listing (active reservation)
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .in('status', ['pending_authorization', 'authorized', 'accepted'])
    .maybeSingle()

  if (existing) throw new Error('You already have an active reservation for this item.')

  // Insert as pending_authorization (required by RLS INSERT policy)
  // The DB trigger will decrement quantity_available automatically
  const { data: reservation, error: insertErr } = await supabase
    .from('reservations')
    .insert({
      listing_id:      listingId,
      buyer_id:        user.id,
      price_snapshot:  listing.price,
      currency:        listing.currency,
      status:          'pending_authorization',
      expires_at:      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
    })
    .select('id')
    .single()

  if (insertErr || !reservation) {
    if (insertErr?.message?.includes('listing_not_available')) {
      throw new Error('This item is sold out.')
    }
    throw new Error(insertErr?.message ?? 'Failed to create reservation.')
  }

  // Advance to 'authorized' via admin client (skips Stripe in v1)
  const admin = createAdminClient()
  await admin
    .from('reservations')
    .update({ status: 'authorized' })
    .eq('id', reservation.id)

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/reservations')
  return reservation.id
}

// ─── Buyer: cancel a reservation ─────────────────────────────────────────────
export async function cancelReservation(reservationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const { error } = await supabase
    .from('reservations')
    .update({
      status:              'cancelled',
      cancellation_reason: 'buyer_cancelled',
      cancelled_by:        'buyer',
    })
    .eq('id', reservationId)
    .eq('buyer_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/reservations')
}
