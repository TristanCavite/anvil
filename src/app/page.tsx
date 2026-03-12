import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'lib/supabase/server'
import SignOutButton from './components/SignOutButton'
import HomeNav from './components/HomeNav'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isSeller = user
    ? !!(await supabase
        .from('seller_business')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()
      ).data
    : false

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* Responsive nav */}
      <HomeNav user={user} isSeller={isSeller} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <main>
        <section style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '48px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background glow orbs */}
          <div style={{
            position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
            width: 'min(600px, 100vw)', height: 400,
            background: 'radial-gradient(ellipse at center, rgba(74,222,128,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '10%', left: '20%',
            width: 300, height: 300,
            background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Badge pill */}
          <div className="animate-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(74,222,128,0.1)',
            border: '1px solid rgba(74,222,128,0.25)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 16px',
            fontSize: '0.78rem', fontWeight: 600,
            color: 'var(--color-green)',
            marginBottom: 24,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', display: 'inline-block' }} className="animate-pulse-green" />
            Fighting food waste, one listing at a time
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up-d1" style={{
            fontSize: 'clamp(2rem, 8vw, 4.5rem)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.04em',
            maxWidth: 780,
            marginBottom: 20,
          }}>
            Surplus food,{' '}
            <span className="gradient-text">not wasted.</span>
          </h1>

          {/* Subheading */}
          <p className="animate-fade-up-d2" style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
            color: 'var(--color-text-2)',
            maxWidth: 500,
            lineHeight: 1.65,
            marginBottom: 36,
            padding: '0 8px',
          }}>
            Connect with local food sellers — bakeries, restaurants, home cooks — and grab
            affordable surplus before it goes to waste.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-up-d3" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 56 }}>
            <Link href="/listings" className="btn-primary" style={{ fontSize: '0.95rem', padding: '12px 24px' }}>
              Browse listings →
            </Link>
            {!user && (
              <Link href="/sign-up" className="btn-ghost" style={{ fontSize: '0.95rem', padding: '12px 24px' }}>
                Join for free
              </Link>
            )}
            {user && !isSeller && (
              <Link href="/seller/onboarding" className="btn-ghost" style={{ fontSize: '0.95rem', padding: '12px 24px' }}>
                Start selling →
              </Link>
            )}
          </div>

          {/* Feature cards — responsive grid */}
          <div className="feature-grid">
            {[
              { icon: '🛒', title: 'Buy Surplus', desc: 'Browse real-time listings from nearby sellers at discounted prices.' },
              { icon: '📦', title: 'Easy Pickup', desc: 'Coordinate directly with sellers for convenient local pickup.' },
              { icon: '🌿', title: 'Reduce Waste', desc: 'Every purchase keeps good food out of the trash and in your home.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ padding: '22px 18px', textAlign: 'left' }}>
                <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: 10 }}>{f.icon}</span>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{f.title}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-2)', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}