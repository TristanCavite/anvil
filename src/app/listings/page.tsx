import Image from 'next/image'
import Link from 'next/link'
import { createClient } from 'lib/supabase/server'

const CATEGORIES = [
  'All',
  'Baked Goods',
  'Fruits & Vegetables',
  'Cooked Meals',
  'Dairy & Eggs',
  'Beverages',
  'Snacks',
  'Grains & Cereals',
  'Condiments & Sauces',
  'Seafood',
  'Meat',
  'Other',
]

interface SearchParams {
  q?:        string
  category?: string
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, category } = await searchParams
  const supabase = await createClient()

  // Find the current user's seller_business id (if any) so we can hide their own listings
  const { data: { user } } = await supabase.auth.getUser()
  let ownBusinessId: string | null = null
  if (user) {
    const { data: biz } = await supabase
      .from('seller_business')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()
    ownBusinessId = biz?.id ?? null
  }

  let query = supabase
    .from('listings')
    .select(`
      id, title, price, currency, category,
      pickup_start, pickup_end, quantity_available,
      seller_business ( city, business_name ),
      listing_photos ( storage_path, sort_order )
    `)
    .eq('status', 'active')
    .gt('quantity_available', 0)
    .order('created_at', { ascending: false })

  if (ownBusinessId) {
    query = query.neq('seller_business_id', ownBusinessId)
  }

  if (q?.trim()) {
    query = query.ilike('title', `%${q.trim()}%`)
  }
  if (category && category !== 'All') {
    query = query.eq('category', category)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawListings } = await query
  const listings = (rawListings ?? []) as any[]

  // Sort photos so cover is first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withCover: any[] = listings.map(l => ({
    ...l,
    cover: [...(l.listing_photos ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null,
  }))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  function coverUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/listing-photos/${path}`
  }

  function formatPickup(start: string | null, end: string | null) {
    if (!start) return null
    const s = new Date(start)
    const e = end ? new Date(end) : null
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Link href="/" className="text-green-600 font-bold text-lg shrink-0">
            FoodMarket
          </Link>

          {/* Search */}
          <form method="GET" className="flex-1 flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search surplus food…"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            {/* preserve category when searching */}
            {category && category !== 'All' && (
              <input type="hidden" name="category" value={category} />
            )}
            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
            >
              Search
            </button>
          </form>

          <Link
            href="/reservations"
            className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
          >
            My reservations
          </Link>
          <Link
            href="/seller/listings"
            className="shrink-0 text-sm text-gray-600 hover:text-gray-900"
          >
            My listings →
          </Link>
        </div>

        {/* Category strip */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => {
            const active = (category ?? 'All') === cat
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (cat !== 'All') params.set('category', cat)
            return (
              <Link
                key={cat}
                href={`/listings${params.toString() ? `?${params}` : ''}`}
                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </Link>
            )
          })}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Result count */}
        <p className="text-sm text-gray-500 mb-5">
          {withCover.length === 0
            ? 'No listings found'
            : `${withCover.length} listing${withCover.length === 1 ? '' : 's'} available`}
          {q ? ` for "${q}"` : ''}
          {category && category !== 'All' ? ` in ${category}` : ''}
        </p>

        {withCover.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 py-24 text-center">
            <p className="text-base font-semibold text-gray-700 mb-1">Nothing here yet</p>
            <p className="text-sm text-gray-400">Try a different search or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {withCover.map(listing => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col"
              >
                {/* Cover photo */}
                <div className="relative aspect-square bg-gray-100">
                  {listing.cover ? (
                    <Image
                      src={coverUrl(listing.cover)}
                      alt={listing.title}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                  )}
                  {/* Category badge */}
                  {listing.category && (
                    <span className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-gray-700">
                      {listing.category}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1 flex-1">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                    {listing.title}
                  </p>

                  <p className="text-base font-bold text-green-700 mt-0.5">
                    ₱{listing.price.toLocaleString()}
                  </p>

                  {listing.seller_business && (() => {
                    const s = Array.isArray(listing.seller_business)
                      ? listing.seller_business[0]
                      : listing.seller_business
                    return s ? (
                      <p className="text-xs text-gray-500 truncate">
                        {s.business_name}{s.city ? ` · ${s.city}` : ''}
                      </p>
                    ) : null
                  })()}

                  {listing.pickup_start && (
                    <p className="text-[11px] text-gray-400 mt-auto pt-1">
                      📦 {formatPickup(listing.pickup_start, listing.pickup_end)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
