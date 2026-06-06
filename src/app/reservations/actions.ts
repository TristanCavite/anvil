'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from 'lib/supabase/server'
import { createAdminClient } from 'lib/supabase/admin'

// ─── Buyer: create a reservation ─────────────────────────────────────────────
export async function createReservation(listingId: string, quantity = 1) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sign in to reserve items.')

  const requestedQuantity = Number(quantity)
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    throw new Error('Quantity must be at least 1.')
  }

  // Fetch listing price snapshot — also confirms it's active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: listing } = await supabase
    .from('listings')
    .select('id, price, currency, quantity_available, status, seller_business ( owner_id )')
    .eq('id', listingId)
    .eq('status', 'active')
    .single() as any

  if (!listing) throw new Error('This listing is no longer available.')
  if (listing.quantity_available <= 0) throw new Error('This item is sold out.')
  if (requestedQuantity > listing.quantity_available) {
    throw new Error('Not enough available units for that reservation.')
  }

  // Prevent sellers from reserving their own listings
  const sellerUserId = Array.isArray(listing.seller_business)
    ? listing.seller_business[0]?.owner_id
    : listing.seller_business?.owner_id
  if (sellerUserId === user.id) {
    throw new Error('You cannot reserve your own listing.')
  }

  // // Check buyer hasn't already reserved this listing (active reservation)
  // const { data: existing } = await supabase
  //   .from('reservations')
  //   .select('id')
  //   .eq('listing_id', listingId)
  //   .eq('buyer_id', user.id)
  //   .in('status', ['pending_authorization', 'authorized', 'accepted'])
  //   .maybeSingle()

  // if (existing) throw new Error('You already have an active reservation for this item.')

  // Insert as pending_authorization (required by RLS INSERT policy).
  // The DB trigger will decrement quantity_available automatically,
  // and the seller dashboard will surface the new request.
  const { data: reservation, error: insertErr } = await supabase
    .from('reservations')
    .insert({
      listing_id:      listingId,
      buyer_id:        user.id,
      quantity:        requestedQuantity,
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

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/reservations')
  revalidatePath('/seller/reservations')
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

// ─── Buyer: increase reservation quantity ───────────────────────────────────
export async function increaseReservationQuantity(reservationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  const admin = createAdminClient()

  const { data: reservation, error: fetchErr } = await admin
    .from('reservations')
    .select('id, buyer_id, listing_id, status, quantity')
    .eq('id', reservationId)
    .single()

  if (fetchErr || !reservation) {
    throw new Error(fetchErr?.message ?? 'Reservation not found.')
  }

  if (reservation.buyer_id !== user.id) {
    throw new Error('Not authorized.')
  }

  if (!['pending_authorization', 'authorized', 'accepted', 'paid'].includes(reservation.status)) {
    throw new Error('This reservation can no longer be updated.')
  }

  const nextQuantity = Number(reservation.quantity ?? 1) + 1

  const { error: updateErr } = await admin
    .from('reservations')
    .update({ quantity: nextQuantity })
    .eq('id', reservationId)

  if (updateErr) {
    if (updateErr.message.includes('listing_not_available')) {
      throw new Error('Not enough available units for one more reservation.')
    }

    throw new Error(updateErr.message)
  }

  revalidatePath(`/reservations/${reservationId}/chat`)
  revalidatePath('/reservations')
  revalidatePath('/seller/reservations')
  revalidatePath(`/listings/${reservation.listing_id}`)

  return nextQuantity
}
