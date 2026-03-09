import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from 'lib/supabase/server'
import DeleteListingButton from './DeleteListingButton'

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-gray-100 text-gray-600',
  active:   'bg-green-100 text-green-700',
  sold_out: 'bg-yellow-100 text-yellow-700',
  expired:  'bg-orange-100 text-orange-700',
  removed:  'bg-red-100 text-red-700',
}

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Get seller_business id for this user
  const { data: business } = await supabase
    .from('seller_business')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/seller/onboarding')

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status, price, currency, quantity, pickup_start, pickup_end, created_at')
    .eq('seller_business_id', business.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{business.business_name}</h1>
          <p className="text-xs text-gray-500">Seller dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Home
          </Link>
          <Link
            href="/seller/listings/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            New listing
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary counts */}
        {listings && listings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {(['active', 'draft', 'sold_out', 'expired'] as const).map(s => {
              const count = listings.filter(l => l.status === s).length
              return (
                <div key={s} className="bg-white rounded-xl border border-gray-200 px-5 py-4">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{s.replace('_', ' ')}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Listings table */}
        {!listings || listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 py-20 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-green-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-1">No listings yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Post your first surplus food item and start reaching buyers nearby.
            </p>
            <Link
              href="/seller/listings/new"
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Create your first listing
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Price</th>
                  <th className="text-left px-5 py-3 font-medium">Qty</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Pickup</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map(listing => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 font-medium text-gray-900 max-w-xs">
                      <span className="line-clamp-1">{listing.title}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {listing.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {listing.currency}&nbsp;{listing.price.toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-gray-700">{listing.quantity}</td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell text-xs">
                      {listing.pickup_start
                        ? new Date(listing.pickup_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/seller/listings/${listing.id}/edit`}
                        className="text-xs font-medium text-green-600 hover:text-green-800"
                      >
                        Edit
                      </Link>
                      {listing.status === 'draft' && (
                        <DeleteListingButton listingId={listing.id} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
