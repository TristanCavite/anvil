'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from 'lib/supabase/browser'

export default function SignOutButton() {
  const supabase = createClient()
  const router   = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      style={{
        color: 'var(--color-text-2)', background: 'none',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
        padding: '6px 14px', cursor: 'pointer', fontSize: '0.875rem',
        fontWeight: 500, transition: 'color 0.15s',
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
