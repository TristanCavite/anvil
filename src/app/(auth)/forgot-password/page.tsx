 'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from 'lib/supabase/browser'
import { getAppUrl } from 'lib/app-url'

type FormState = 'idle' | 'loading' | 'success'

export default function ForgotPasswordPage() {
	const supabase = createClient()

	const [email, setEmail] = useState('')
	const [formState, setFormState] = useState<FormState>('idle')
	const [error, setError] = useState<string | null>(null)

	function formatError(authError: { message: string; code?: string; status?: number }) {
		const details = [authError.code, authError.status ? `HTTP ${authError.status}` : null].filter(Boolean)
		return details.length > 0 ? `${authError.message} (${details.join(', ')})` : authError.message
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError(null)
		setFormState('loading')

		const appUrl = getAppUrl()
		if (!appUrl) {
			setError('App URL is not configured.')
			setFormState('idle')
			return
		}

		const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
		})

		if (resetError) {
			console.error('Supabase password reset error:', resetError)
			setError(formatError(resetError))
			setFormState('idle')
			return
		}

		setFormState('success')
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
					Check your email
				</h1>
				<p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.65 }}>
					If an account exists for <span style={{ fontWeight: 600, color: '#111827' }}>{email}</span>, we sent a password reset link.
					Open it to set a new password.
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
				<Link href="/sign-in" style={{ fontWeight: 600, color: '#16a34a', textDecoration: 'none', fontSize: '0.875rem' }}>
					Back to sign in
				</Link>
			</div>
		)
	}

	return (
		<>
			<h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.03em' }}>
				Forgot your password?
			</h1>
			<p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
				Enter the email linked to your NeighborGoods account and we&apos;ll send a reset link.
			</p>

			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
					{formState === 'loading' ? 'Sending reset link…' : 'Send reset link'}
				</button>
			</form>

			<p style={{ marginTop: 24, textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
				Remembered it?{' '}
				<Link href="/sign-in" style={{ fontWeight: 600, color: '#16a34a', textDecoration: 'none' }}>
					Back to sign in
				</Link>
			</p>
		</>
	)
}
