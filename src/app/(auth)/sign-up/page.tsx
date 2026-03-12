'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from 'lib/supabase/browser'

type FormState = 'idle' | 'loading' | 'success'

export default function SignUpPage() {
  const supabase = createClient()

  const [displayName, setDisplayName]   = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formState, setFormState]       = useState<FormState>('idle')
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFormState('loading')

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: displayName },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setFormState('idle')
      return
    }

    setFormState('success')
  }

  // ── Success state ──────────────────────────────────────────
  if (formState === 'success') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16a34a" style={{ width: 28, height: 28 }}>
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>Check your email</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
          We sent a verification link to{' '}
          <span style={{ fontWeight: 600, color: '#111827' }}>{email}</span>.
          Click it to activate your account.
        </p>
        <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
          Didn&apos;t get it? Check spam or{' '}
          <button
            type="button"
            onClick={() => setFormState('idle')}
            style={{ color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 'inherit', padding: 0 }}
          >
            try again
          </button>
          .
        </p>
      </div>
    )
  }

  // ── Form state ─────────────────────────────────────────────
  return (
    <>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.03em' }}>
        Create your account
      </h1>
      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 28 }}>
        Join NeighborGoods and start saving on surplus food.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Display name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="displayName" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Maria Santos"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            disabled={formState === 'loading'}
            className="input-field"
          />
        </div>

        {/* Email */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="email" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={formState === 'loading'}
            className="input-field"
          />
        </div>

        {/* Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={formState === 'loading'}
              className="input-field"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', fontSize: '0.85rem', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {/* Submit */}
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
          {formState === 'loading' ? 'Creating account…' : 'Create account'}
        </button>

        {/* Terms note */}
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>

      </form>

      <p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        Already have an account?{' '}
        <Link href="/sign-in" style={{ fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </>
  )
}
