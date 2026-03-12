import Image from 'next/image'
import Link from 'next/link'
import { createClient } from 'lib/supabase/server'
import MobileNav from '../components/MobileNav'

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

  if (ownBusinessId) query = query.neq('seller_business_id', ownBusinessId)
  if (q?.trim()) {
    // textSearch leverages Postgres GiST/GIN indexes and parses words natively, much faster than ilike
    query = query.textSearch('title', q.trim().replace(/\s+/g, ' | '), {
      type: 'websearch',
      config: 'english'
    })
  }
  if (category && category !== 'All') query = query.eq('category', category)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawListings } = await query
  const listings = (rawListings ?? []) as any[]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const withCover: any[] = listings.map(l => ({
    ...l,
    cover: [...(l.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null,
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
      ' ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    return e ? `${fmt(s)} – ${fmt(e)}` : fmt(s)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── Sticky Header ──────────────────────────────────── */}
      <header style={{
        background: '#0f1117',
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* Top row: logo + search + nav */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="NeighborGoods" width={28} height={28} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Neighbor<span style={{ color: '#4ade80' }}>Goods</span>
            </span>
          </Link>

          {/* Search — grows to fill space */}
          <form method="GET" style={{ flex: '1 1 200px', minWidth: 0, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#6b7280"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, pointerEvents: 'none', flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                name="q"
                defaultValue={q ?? ''}
                placeholder="Search surplus food…"
                style={{
                  width: '100%', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.07)', color: '#f1f5f9',
                  padding: '8px 12px 8px 32px', fontSize: '0.85rem', outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              {category && category !== 'All' && (
                <input type="hidden" name="category" value={category} />
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '7px 14px', borderRadius: 9, fontSize: '0.82rem', flexShrink: 0 }}>
              Search
            </button>
          </form>

          <MobileNav user={user} isSeller={!!ownBusinessId} />
        </div>

        {/* Category strip */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px 10px', display: 'flex', gap: 6, overflowX: 'auto' }} className="scrollbar-hide">
          {CATEGORIES.map(cat => {
            const active = (category ?? 'All') === cat
            const params = new URLSearchParams()
            if (q) params.set('q', q)
            if (cat !== 'All') params.set('category', cat)
            return (
              <Link
                key={cat}
                href={`/listings${params.toString() ? `?${params}` : ''}`}
                style={{
                  flexShrink: 0, borderRadius: 'var(--radius-full)',
                  padding: '5px 13px', fontSize: '0.75rem', fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.15s',
                  background: active ? '#22c55e' : 'rgba(255,255,255,0.07)',
                  color: active ? '#000' : '#94a3b8',
                  border: `1px solid ${active ? '#22c55e' : 'rgba(255,255,255,0.1)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </Link>
            )
          })}
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 16px' }}>

        {/* Result count */}
        <p style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500, marginBottom: 16 }}>
          {withCover.length === 0
            ? 'No listings found'
            : `${withCover.length} listing${withCover.length === 1 ? '' : 's'} available`}
          {q ? ` for "${q}"` : ''}
          {category && category !== 'All' ? ` in ${category}` : ''}
        </p>

        {withCover.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#fff', borderRadius: 'var(--radius-xl)',
            border: '2px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#16a34a" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Nothing here yet</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Try a different search or check back later.</p>
          </div>
        ) : (
          /* Responsive listings grid — CSS class handles breakpoints */
          <div className="listings-grid">
            {withCover.map(listing => {
              const seller = Array.isArray(listing.seller_business)
                ? listing.seller_business[0]
                : listing.seller_business
              return (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  className="listing-card"
                >
                  {/* Cover */}
                  <div style={{ position: 'relative', aspectRatio: '4/3', background: '#f1f5f9', overflow: 'hidden' }}>
                    {listing.cover ? (
                      <Image
                        src={coverUrl(listing.cover)}
                        alt={listing.title}
                        fill
                        style={{ objectFit: 'cover', transition: 'transform 0.4s' }}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="#cbd5e1" style={{ width: 36, height: 36 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                    )}
                    {listing.category && (
                      <span style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '0.65rem', fontWeight: 600, color: '#374151' }}>
                        {listing.category}
                      </span>
                    )}
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: '#16a34a', borderRadius: 'var(--radius-full)', padding: '3px 9px', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                      ₱{listing.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {listing.title}
                    </p>
                    {seller && (
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {seller.business_name}{seller.city ? ` · ${seller.city}` : ''}
                      </p>
                    )}
                    {listing.pickup_start && (
                      <p style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 'auto', paddingTop: 4 }}>
                        📦 {formatPickup(listing.pickup_start, listing.pickup_end)}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <style>{`
        .listing-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  )
}
