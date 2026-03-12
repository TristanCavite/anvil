'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from 'lib/supabase/server'

async function getSellerReservation(reservationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // Verify the reservation is on one of this seller's listings
  const { data } = await supabase
    .from('reservations')
    .select('id, status, listing_id')
    .eq('id', reservationId)
    .single()

  if (!data) throw new Error('Reservation not found')
  return { supabase, data }
}

export async function acceptReservation(reservationId: string) {
  const { supabase, data } = await getSellerReservation(reservationId)
  if (data.status !== 'authorized') throw new Error('Reservation is not in an acceptable state.')

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'accepted' })
    .eq('id', reservationId)

  if (error) throw new Error(error.message)
  revalidatePath('/seller/reservations')
}

export async function declineReservation(reservationId: string) {
  const { supabase, data } = await getSellerReservation(reservationId)
  if (!['authorized', 'accepted'].includes(data.status)) throw new Error('Cannot decline at this stage.')

  const { error } = await supabase
    .from('reservations')
    .update({
      status:              'declined',
      cancellation_reason: 'no_stock',
      cancelled_by:        'seller',
    })
    .eq('id', reservationId)

  if (error) throw new Error(error.message)
  revalidatePath('/seller/reservations')
}

export async function fulfillReservation(reservationId: string) {
  const { supabase, data } = await getSellerReservation(reservationId)
  if (data.status !== 'accepted') throw new Error('Reservation must be accepted before fulfilling.')

  const { error } = await supabase
    .from('reservations')
    .update({ status: 'fulfilled' })
    .eq('id', reservationId)

  if (error) throw new Error(error.message)
  revalidatePath('/seller/reservations')
}
