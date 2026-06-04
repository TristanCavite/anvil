'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from 'lib/supabase/browser'

type FormState = 'idle' | 'loading' | 'success'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formState, setFormState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      setSessionReady(!!data.session)
    }

    void checkSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setFormState('loading')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setFormState('idle')
      return
    }

    await supabase.auth.signOut()
    setFormState('success')
    router.push('/sign-in?reset=success')
    router.refresh()
  }

  if (formState === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" style={{ width: 28, height: 28 }}>
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Password updated
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
          Your NeighborGoods password has been changed successfully.
        </p>
        <Link href="/sign-in" style={{ fontWeight: 600, color: '#16a34a', textDecoration: 'none', fontSize: '0.875rem' }}>
          Go to sign in
        </Link>
      </div>
    )
  }

  if (sessionReady === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ width: 28, height: 28, color: '#2563eb' }}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Checking recovery link
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
          Verifying your password reset session...
        </p>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#d97706" style={{ width: 28, height: 28 }}>
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2.002 4.043-2.002 5.198 0l6.334 10.977c1.154 2-.29 4.5-2.598 4.5H5.665c-2.308 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
          Recovery link not ready
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
          Open the reset link from your email again. If the link expired, request a new one.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/forgot-password" className="btn-primary-light" style={{ textDecoration: 'none' }}>
            Request new link
          </Link>
          <Link href="/sign-in" className="btn-outline-light" style={{ textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.03em' }}>
        Set a new password
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
        Choose a new password for your NeighborGoods account.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={formState === 'loading'}
            className="input-field"
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="confirmPassword" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            disabled={formState === 'loading'}
            className="input-field"
          />
        </div>

        {error && (
          <div style={{ borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', fontSize: '0.85rem', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={formState === 'loading'}
          className="btn-primary-light"
          style={{ marginTop: 4, width: '100%', padding: '12px', fontSize: '0.9rem' }}
        >
          {formState === 'loading' && (
            <svg className="animate-spin" style={{ width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {formState === 'loading' ? 'Updating password…' : 'Update password'}
        </button>
      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        Need a new link?{' '}
        <Link href="/forgot-password" style={{ fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
          Reset password again
        </Link>
      </p>
    </>
  )
}