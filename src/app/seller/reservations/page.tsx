import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from 'lib/supabase/server'
import ReservationActions from './ReservationActions'

const STATUS_STYLES: Record<string, string> = {
  authorized: 'bg-blue-50 text-blue-700',
  accepted:   'bg-green-50 text-green-700',
  fulfilled:  'bg-gray-100 text-gray-600',
  declined:   'bg-red-50 text-red-600',
  cancelled:  'bg-gray-100 text-gray-500',
  expired:    'bg-orange-50 text-orange-600',
}

const STATUS_LABELS: Record<string, string> = {
  authorized: 'Waiting for you',
  accepted:   'Accepted',
  fulfilled:  'Fulfilled',
  declined:   'Declined',
  cancelled:  'Cancelled',
  expired:    'Expired',
}

export default async function SellerReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: business } = await supabase
    .from('seller_business')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/seller/onboarding')

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id, status, price_snapshot, currency, created_at,
      listings ( id, title ),
      profiles!buyer_id ( display_name, phone )
    `)
    .in(
      'listing_id',
      // subquery: listings owned by this seller
      (await supabase
        .from('listings')
        .select('id')
        .eq('seller_business_id', business.id)
      ).data?.map(l => l.id) ?? []
    )
    .order('created_at', { ascending: false })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (reservations ?? []) as any[]

  const actionable  = rows.filter(r => ['authorized', 'accepted'].includes(r.status))
  const historical  = rows.filter(r => !['authorized', 'accepted'].includes(r.status))

  function formatDate(dt: string) {
    return new Date(dt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function ReservationRow({ r }: { r: any }) {
    const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings
    const buyer   = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <Link
                href={`/listings/${listing?.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-green-700"
              >
                {listing?.title ?? '—'}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                Buyer: {buyer?.display_name ?? 'Unknown'}
                {buyer?.phone ? ` · ${buyer.phone}` : ''}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[r.status] ?? r.status}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            ₱{Number(r.price_snapshot).toLocaleString()} · {formatDate(r.created_at)}
          </p>
        </div>
        <ReservationActions reservationId={r.id} status={r.status} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Incoming Reservations</h1>
          <p className="text-xs text-gray-500">{business.business_name}</p>
        </div>
        <Link href="/seller/listings" className="text-sm text-gray-500 hover:text-gray-800">
          ← My listings
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        {/* Action required */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Action required ({actionable.length})
          </h2>
          {actionable.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-200 px-5 py-6 text-center">
              No pending reservations right now.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {actionable.map(r => <ReservationRow key={r.id} r={r} />)}
            </div>
          )}
        </section>

        {/* History */}
        {historical.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              History
            </h2>
            <div className="flex flex-col gap-3">
              {historical.map(r => <ReservationRow key={r.id} r={r} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
