import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from 'lib/supabase/server'
import MobileNav from '../components/MobileNav'

export default async function ProfilePage() {
  const supabase = await createClient()

  // 1. Get auth user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // 2. Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, bio, gender, phone')
    .eq('id', user.id)
    .single()

  // 3. Check if seller
  const { data: business } = await supabase
    .from('seller_business')
    .select('id, business_name')
    .eq('owner_id', user.id)
    .maybeSingle()

  const displayName = profile?.display_name || user.user_metadata?.full_name || 'Anonymous User'
  const email = user.email

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{ background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 768, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', flexShrink: 0 }}>
              <Image src="/logo.png" alt="NeighborGoods" width={28} height={28} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Neighbor<span style={{ color: '#4ade80' }}>Goods</span>
              </span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <MobileNav user={user} isSeller={!!business} />
          </div>

        </div>
      </header>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px 16px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
              Your Profile
            </h1>
            <Link href="/profile/edit" className="btn-primary-light" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: 8 }}>
              Edit Profile
            </Link>
          </div>

          {/* Profile Card */}
          <div style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            
            {/* Header / Avatar Section */}
            <div style={{ background: '#0f1117', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              
              {/* Background Glow */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse at top, rgba(74,222,128,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ width: 100, height: 100, borderRadius: '50%', background: '#1e293b', border: '4px solid #fff', overflow: 'hidden', marginBottom: 16, position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={displayName} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#cbd5e1" style={{ width: 44, height: 44, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
              </div>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4, position: 'relative', zIndex: 1 }}>{displayName}</h2>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', position: 'relative', zIndex: 1 }}>{email}</p>
            </div>

            {/* Details Section */}
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: 24 }}>
                
                {/* Contact */}
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Contact</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#cbd5e1" style={{ width: 16, height: 16 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{email}</span>
                      <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Read-only</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#cbd5e1" style={{ width: 16, height: 16 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.436-4.136-7.032-7.032l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      {profile?.phone ? (
                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>{profile.phone}</span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: '#f1f5f9' }} />

                {/* About */}
                <div>
                  <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>About</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#cbd5e1" style={{ width: 16, height: 16, marginTop: 3 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                      </svg>
                      <div>
                        {profile?.bio ? (
                          <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>{profile.bio}</p>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>No bio provided</p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#cbd5e1" style={{ width: 16, height: 16 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                      {profile?.gender ? (
                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500, textTransform: 'capitalize' }}>
                          {profile.gender.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Gender not specified</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seller Section */}
                {business && (
                  <>
                    <div style={{ height: 1, background: '#f1f5f9' }} />
                    <div>
                      <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Seller Business</h3>
                      <Link href="/seller/listings" style={{ 
                        display: 'flex', alignItems: 'center', gap: 12, 
                        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, 
                        padding: '12px 16px', textDecoration: 'none', transition: 'all 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }} className="seller-card">
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#16a34a" style={{ width: 20, height: 20 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {business.business_name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Go to dashboard →</p>
                        </div>
                      </Link>
                    </div>
                  </>
                )}

              </div>
            </div>
          </div>
          
        </div>
      </main>

      <style>{`
        .seller-card:hover { border-color: #16a34a !important; background: #f0fdf4 !important; }
      `}</style>
    </div>
  )
}
