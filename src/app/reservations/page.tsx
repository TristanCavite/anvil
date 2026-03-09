import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from 'lib/supabase/server'
import CancelReservationButton from './CancelReservationButton'

const STATUS_STYLES: Record<string, string> = {
  authorized:            'bg-blue-50 text-blue-700',
  accepted:              'bg-green-50 text-green-700',
  fulfilled:             'bg-gray-100 text-gray-600',
  declined:              'bg-red-50 text-red-600',
  cancelled:             'bg-gray-100 text-gray-500',
  expired:               'bg-orange-50 text-orange-600',
  pending_authorization: 'bg-yellow-50 text-yellow-700',
}

const STATUS_LABELS: Record<string, string> = {
  authorized:            'Confirmed — awaiting seller',
  accepted:              'Accepted — ready for pickup',
  fulfilled:             'Fulfilled',
  declined:              'Declined by seller',
  cancelled:             'Cancelled',
  expired:               'Expired',
  pending_authorization: 'Pending',
}

const CANCELLABLE = new Set(['authorized', 'pending_authorization'])

export default async function BuyerReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id, status, price_snapshot, currency, created_at, expires_at,
      listings (
        id, title, pickup_start, pickup_end,
        listing_photos ( storage_path, sort_order ),
        seller_business ( business_name, city )
      )
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (reservations ?? []) as any[]

  function formatDate(dt: string | null) {
    if (!dt) return '—'
    return new Date(dt).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-900">My Reservations</h1>
        <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-800">
          ← Browse listings
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 py-24 text-center">
            <p className="text-base font-semibold text-gray-700 mb-1">No reservations yet</p>
            <p className="text-sm text-gray-400 mb-6">Browse surplus food and reserve something.</p>
            <Link href="/listings" className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map(r => {
              const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings
              const seller  = listing
                ? (Array.isArray(listing.seller_business) ? listing.seller_business[0] : listing.seller_business)
                : null
              const cover   = listing?.listing_photos
                ? [...listing.listing_photos].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.storage_path
                : null
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

              return (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-4 items-start">
                  {/* Cover thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${supabaseUrl}/storage/v1/object/public/listing-photos/${cover}`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/listings/${listing?.id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-green-700 line-clamp-1"
                        >
                          {listing?.title ?? 'Unknown listing'}
                        </Link>
                        {seller && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {seller.business_name}{seller.city ? ` · ${seller.city}` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`shrink-0 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="text-xs text-gray-400 space-y-0.5">
                        <p>₱{Number(r.price_snapshot).toLocaleString()} · Reserved {formatDate(r.created_at)}</p>
                        {listing?.pickup_start && (
                          <p>Pickup: {formatDate(listing.pickup_start)}</p>
                        )}
                      </div>
                      {CANCELLABLE.has(r.status) && (
                        <CancelReservationButton reservationId={r.id} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
