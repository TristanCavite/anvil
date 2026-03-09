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
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
