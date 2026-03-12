import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left: Brand Panel ────────────────────────────── */}
      <div style={{
        display: 'none',
        flex: '0 0 44%',
        background: 'linear-gradient(160deg, #0f1117 0%, #0d1f0f 60%, #0a2010 100%)',
        padding: '48px 56px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }} className="auth-panel-left">

        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '30%', left: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(74,222,128,0.14) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', zIndex: 1 }}>
          <Image src="/logo.png" alt="NeighborGoods" width={40} height={40} />
          <span style={{ fontWeight: 700, fontSize: '1.15rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
            Neighbor<span style={{ color: '#4ade80' }}>Goods</span>
          </span>
        </Link>

        {/* Middle text */}
        <div style={{ zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.03em' }}>
            Turn surplus food<br />into opportunity.
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: 340 }}>
            Join thousands of local sellers and buyers reducing food waste while saving money every day.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {[
              { value: '2,400+', label: 'Listings posted' },
              { value: '890+', label: 'Happy buyers' },
              { value: '1.2t', label: 'Food saved' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4ade80', letterSpacing: '-0.02em' }}>{s.value}</p>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p style={{ fontSize: '0.78rem', color: '#475569', zIndex: 1 }}>
          © 2026 NeighborGoods · All rights reserved
        </p>
      </div>

      {/* ── Right: Form Panel ────────────────────────────── */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}>

        {/* Mobile logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 36 }} className="auth-mobile-logo">
          <Image src="/logo.png" alt="NeighborGoods" width={36} height={36} />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Neighbor<span style={{ color: '#16a34a' }}>Goods</span>
          </span>
        </Link>

        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#fff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
          padding: '40px 36px',
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-panel-left { display: flex !important; }
          .auth-mobile-logo { display: none !important; }
        }
      `}</style>

    </div>
  )
}
