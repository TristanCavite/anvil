import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'lib/supabase/server'
import DeleteListingButton from './DeleteListingButton'
import MobileNav from '../../components/MobileNav'

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  draft:    { label: 'Draft',    bg: '#f1f5f9', color: '#475569' },
  active:   { label: 'Active',   bg: '#dcfce7', color: '#15803d' },
  sold_out: { label: 'Sold out', bg: '#fef9c3', color: '#a16207' },
  expired:  { label: 'Expired',  bg: '#ffedd5', color: '#c2410c' },
  removed:  { label: 'Removed',  bg: '#fee2e2', color: '#b91c1c' },
}

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: business } = await supabase
    .from('seller_business')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/seller/onboarding')

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, status, price, currency, quantity, quantity_available, pickup_start, pickup_end, created_at')
    .eq('seller_business_id', business.id)
    .order('created_at', { ascending: false })

  const stats = (['active', 'draft', 'sold_out', 'expired'] as const).map(s => ({
    key: s,
    label: STATUS_META[s]?.label ?? s,
    count: (listings ?? []).filter(l => l.status === s).length,
    color: STATUS_META[s]?.color ?? '#475569',
    bg: STATUS_META[s]?.bg ?? '#f1f5f9',
  }))

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header style={{ background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
              <Image src="/logo.png" alt="NeighborGoods" width={28} height={28} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Neighbor<span style={{ color: '#4ade80' }}>Goods</span>
              </span>
            </Link>
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Link
              href="/seller/listings/new"
              className="btn-primary"
              style={{ padding: '7px 11px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="New listing"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16 }}>
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            </Link>
            
            <MobileNav user={user} isSeller={true} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px' }}>

        {/* Stats — responsive 2→4 grid */}
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          {stats.map(s => (
            <div key={s.key} style={{
              background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0',
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.count}</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500, lineHeight: 1.3 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Listings */}
        {!listings || listings.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#fff', borderRadius: 'var(--radius-xl)',
            border: '2px dashed #e2e8f0', padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#16a34a" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: 6 }}>No listings yet</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 20, maxWidth: 280 }}>
              Post your first surplus food item and start reaching buyers nearby.
            </p>
            <Link href="/seller/listings/new" className="btn-primary-light" style={{ padding: '10px 22px', fontSize: '0.875rem', borderRadius: 10 }}>
              Create your first listing
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827' }}>
                All Listings <span style={{ color: '#94a3b8', fontWeight: 400 }}>({listings.length})</span>
              </h2>
            </div>

            {/* Desktop table */}
            <div className="table-desktop">
              <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    {['Title', 'Status', 'Price', 'Qty', 'Pickup', ''].map((h, i) => (
                      <th key={i} style={{ textAlign: 'left', padding: '10px 16px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing, idx) => {
                    const meta = STATUS_META[listing.status] ?? STATUS_META.draft
                    return (
                      <tr key={listing.id} style={{ borderBottom: idx < listings.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.12s' }} className="seller-row">
                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#111827', maxWidth: 240 }}>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.title}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', borderRadius: 'var(--radius-full)', padding: '3px 9px', fontSize: '0.7rem', fontWeight: 700, background: meta.bg, color: meta.color }}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151', fontWeight: 600 }}>
                          {listing.currency}&nbsp;{listing.price.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#374151' }}>
                          <span style={{ fontWeight: 700 }}>{listing.quantity_available}</span>
                          <span style={{ color: '#9ca3af' }}>/{listing.quantity}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.78rem' }}>
                          {listing.pickup_start ? new Date(listing.pickup_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                            <Link href={`/seller/listings/${listing.id}/edit`} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>Edit</Link>
                            {listing.status === 'draft' && <DeleteListingButton listingId={listing.id} />}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile card stack */}
            <div className="card-stack" style={{ padding: '12px' }}>
              {listings.map(listing => {
                const meta = STATUS_META[listing.status] ?? STATUS_META.draft
                return (
                  <div key={listing.id} className="listing-stack-card">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {listing.title}
                      </p>
                      <span style={{ flexShrink: 0, display: 'inline-block', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: 12 }}>
                        <span style={{ fontWeight: 600, color: '#374151' }}>{listing.currency} {listing.price.toLocaleString()}</span>
                        <span>Qty: {listing.quantity_available}/{listing.quantity}</span>
                        {listing.pickup_start && (
                          <span>Pickup: {new Date(listing.pickup_start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <Link href={`/seller/listings/${listing.id}/edit`} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>Edit</Link>
                        {listing.status === 'draft' && <DeleteListingButton listingId={listing.id} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      <style>{`
        .seller-row:hover { background: #fafafa; }
      `}</style>
    </div>
  )
}
