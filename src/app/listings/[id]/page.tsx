import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from 'lib/supabase/server'
import ReserveButton from './ReserveButton'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const selectCols = [
    'id, title, description, category, price, currency',
    'quantity, quantity_available, pickup_start, pickup_end',
    'status, created_at',
    'seller_business ( id, business_name, address_line, city, province, plus_code, owner_id )',
    'listing_photos ( id, storage_path, sort_order )',
  ].join(', ')

  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawListing } = await supabase
    .from('listings')
    .select(selectCols)
    .eq('id', id)
    .eq('status', 'active')
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listing = rawListing as any

  if (!listing) notFound()

  // Hide the listing from its own seller
  const sellerUserId = Array.isArray(listing.seller_business)
    ? listing.seller_business[0]?.owner_id
    : listing.seller_business?.owner_id
  if (user && sellerUserId === user.id) notFound()

  const photos = [...(listing.listing_photos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  function photoUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/listing-photos/${path}`
  }

  const seller = (Array.isArray(listing.seller_business)
    ? listing.seller_business[0]
    : listing.seller_business) as {
    id: string
    business_name: string
    address_line: string | null
    city: string | null
    province: string | null
    plus_code: string | null
    owner_id: string | null
  } | null

  function formatDatetime(dt: string | null) {
    if (!dt) return '—'
    return new Date(dt).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    })
  }

  const isSoldOut = listing.quantity_available === 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-3">
        <Link href="/listings" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back to listings
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* ── Photo gallery ── */}
          <div className="flex flex-col gap-3">
            {/* Main photo */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 w-full">
              {photos.length > 0 ? (
                <Image
                  src={photoUrl(photos[0].storage_path)}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnails row */}
            {photos.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {photos.slice(1).map(p => (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={photoUrl(p.storage_path)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="20vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          <div className="flex flex-col gap-5">
            {/* Title + price */}
            <div>
              {listing.category && (
                <span className="inline-block rounded-full bg-green-50 text-green-700 text-xs font-medium px-2.5 py-0.5 mb-2">
                  {listing.category}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900 leading-snug">{listing.title}</h1>
              <p className="text-3xl font-extrabold text-green-700 mt-2">
                ₱{listing.price.toLocaleString()}
              </p>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isSoldOut ? 'bg-red-400' : 'bg-green-500'}`} />
              <span className="text-sm text-gray-700">
                {isSoldOut
                  ? 'Sold out'
                  : `${listing.quantity_available} of ${listing.quantity} available`}
              </span>
            </div>

            {/* Pickup window */}
            {listing.pickup_start && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pickup window</p>
                <p className="text-sm text-gray-800">{formatDatetime(listing.pickup_start)}</p>
                {listing.pickup_end && (
                  <p className="text-sm text-gray-800">until {formatDatetime(listing.pickup_end)}</p>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">About this item</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Seller */}
            {seller && (
              <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Seller</p>
                <p className="text-sm font-semibold text-gray-900">{seller.business_name}</p>
                {(seller.address_line || seller.city) && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[seller.address_line, seller.city, seller.province].filter(Boolean).join(', ')}
                  </p>
                )}
                {seller.plus_code && (
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{seller.plus_code}</p>
                )}
              </div>
            )}

            {/* Reserve CTA */}
            <ReserveButton listingId={listing.id} isSoldOut={isSoldOut} />
          </div>

        </div>
      </main>
    </div>
  )
}
