'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface NavProps {
  user: { id: string } | null
  isSeller: boolean
}

export default function HomeNav({ user, isSeller }: NavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <Image src="/logo.png" alt="NeighborGoods logo" width={32} height={32} />
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              Neighbor<span style={{ color: 'var(--color-green)' }}>Goods</span>
            </span>
          </Link>

          {/* Full-screen hamburger */}
          <button
            onClick={() => setOpen(true)}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: 'var(--color-text)', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 20, height: 20 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div className={`mobile-menu${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <div className="mobile-menu-panel" onClick={e => e.stopPropagation()}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>Menu</span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 20, height: 20 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <Link className="mobile-menu-link" href="/listings" onClick={() => setOpen(false)}>🛒 Browse listings</Link>

          {user ? (
            <>
              <Link className="mobile-menu-link" href="/reservations" onClick={() => setOpen(false)}>📦 My Reservations</Link>
              <Link className="mobile-menu-link" href="/profile" onClick={() => setOpen(false)}>👤 Profile</Link>
              {isSeller
                ? <Link className="mobile-menu-link" href="/seller/listings" onClick={() => setOpen(false)}>📊 Seller Dashboard</Link>
                : <Link className="mobile-menu-link" href="/seller/onboarding" onClick={() => setOpen(false)}>🚀 Start Selling</Link>
              }
              <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <form action="/auth/sign-out" method="post">
                  <button type="submit" className="mobile-menu-link" style={{ color: '#f87171' }}>Sign out</button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link className="mobile-menu-link" href="/sign-in" onClick={() => setOpen(false)}>Sign in</Link>
              <Link href="/sign-up" onClick={() => setOpen(false)} className="btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
                Sign up free
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
