import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from 'lib/supabase/server'
import CancelReservationButton from './CancelReservationButton'
import MobileNav from '../components/MobileNav'

const STATUS_META: Record<string, { label: string; borderColor: string; bg: string; badgeBg: string; badgeColor: string }> = {
  authorized:            { label: 'Confirmed — awaiting seller', borderColor: '#3b82f6', bg: '#eff6ff', badgeBg: '#dbeafe', badgeColor: '#1d4ed8' },
  accepted:              { label: 'Accepted — ready for pickup', borderColor: '#16a34a', bg: '#f0fdf4', badgeBg: '#dcfce7', badgeColor: '#15803d' },
  fulfilled:             { label: 'Fulfilled',                   borderColor: '#94a3b8', bg: '#f8fafc', badgeBg: '#f1f5f9', badgeColor: '#64748b' },
  declined:              { label: 'Declined by seller',          borderColor: '#ef4444', bg: '#fff5f5', badgeBg: '#fee2e2', badgeColor: '#b91c1c' },
  cancelled:             { label: 'Cancelled',                   borderColor: '#94a3b8', bg: '#f8fafc', badgeBg: '#f1f5f9', badgeColor: '#64748b' },
  expired:               { label: 'Expired',                     borderColor: '#f97316', bg: '#fff7ed', badgeBg: '#ffedd5', badgeColor: '#c2410c' },
  pending_authorization: { label: 'Pending',                     borderColor: '#eab308', bg: '#fefce8', badgeBg: '#fef9c3', badgeColor: '#a16207' },
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
    return new Date(dt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>

      {/* Header */}
      <header style={{ background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
              <Image src="/logo.png" alt="NeighborGoods" width={28} height={28} />
            </Link>
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
            <h1 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>My Reservations</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <MobileNav user={user} isSeller={false} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px' }}>
        {rows.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#fff', borderRadius: 'var(--radius-xl)',
            border: '2px dashed #e2e8f0', padding: '60px 20px', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#16a34a" style={{ width: 28, height: 28 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>No reservations yet</p>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 20 }}>Browse surplus food and reserve something great.</p>
            <Link href="/listings" className="btn-primary-light" style={{ padding: '10px 22px', fontSize: '0.85rem', borderRadius: 10 }}>
              Browse listings
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => {
              const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings
              const seller  = listing
                ? (Array.isArray(listing.seller_business) ? listing.seller_business[0] : listing.seller_business)
                : null
              const cover = listing?.listing_photos
                ? [...listing.listing_photos].sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)[0]?.storage_path
                : null
              const meta = STATUS_META[r.status] ?? STATUS_META.fulfilled

              return (
                <div key={r.id} style={{
                  background: meta.bg,
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  borderLeft: `4px solid ${meta.borderColor}`,
                  padding: '14px 16px',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  {/* Thumbnail */}
                  <div style={{ width: 62, height: 62, borderRadius: 9, overflow: 'hidden', background: '#e2e8f0', flexShrink: 0 }}>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${supabaseUrl}/storage/v1/object/public/listing-photos/${cover}`}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title + badge row — wraps on mobile */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <Link
                          href={`/listings/${listing?.id}`}
                          style={{ fontSize: '0.875rem', fontWeight: 700, color: '#111827', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {listing?.title ?? 'Unknown listing'}
                        </Link>
                        {seller && (
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {seller.business_name}{seller.city ? ` · ${seller.city}` : ''}
                          </p>
                        )}
                      </div>
                      <span style={{
                        flexShrink: 0, display: 'inline-flex', alignItems: 'center',
                        borderRadius: 'var(--radius-full)', padding: '3px 10px',
                        fontSize: '0.68rem', fontWeight: 700,
                        background: meta.badgeBg, color: meta.badgeColor,
                        whiteSpace: 'nowrap',
                      }}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        <p>₱{Number(r.price_snapshot).toLocaleString()} · Reserved {formatDate(r.created_at)}</p>
                        {listing?.pickup_start && (
                          <p>📦 Pickup: {formatDate(listing.pickup_start)}</p>
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
