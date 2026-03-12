'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from 'lib/supabase/browser'

const GENDER_OPTIONS = [
  { value: 'male',              label: 'Male' },
  { value: 'female',            label: 'Female' },
  { value: 'non_binary',        label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

type Gender = typeof GENDER_OPTIONS[number]['value']

export default function OnboardingPage() {
  const supabase = createClient()
  const router   = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bio, setBio]                     = useState('')
  const [gender, setGender]               = useState<Gender | ''>('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(skip = false) {
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    let avatarUrl: string | null = null

    if (!skip && avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (uploadError) {
        setError('Failed to upload avatar. Please try again.')
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatarUrl = publicUrl
    }

    const updates: Record<string, unknown> = { onboarding_completed: true }
    if (!skip) {
      if (avatarUrl)  updates.avatar_url = avatarUrl
      if (bio.trim()) updates.bio        = bio.trim()
      if (gender)     updates.gender     = gender
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (updateError) {
      setError('Failed to save profile. Please try again.')
      setLoading(false)
      return
    }

    router.push('/listings')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 32 }}>
        <Image src="/logo.png" alt="NeighborGoods" width={36} height={36} />
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', letterSpacing: '-0.02em' }}>
          Neighbor<span style={{ color: '#16a34a' }}>Goods</span>
        </span>
      </Link>

      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" style={{ width: 14, height: 14 }}>
            <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
        </div>
        <div style={{ height: 2, width: 60, background: '#d1fae5', borderRadius: 2 }} />
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>2</span>
        </div>
        <div style={{ height: 2, width: 60, background: '#e5e7eb', borderRadius: 2 }} />
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af' }}>3</span>
        </div>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
        padding: '36px 32px',
        display: 'flex', flexDirection: 'column', gap: 24,
      }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Set up your profile
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.6 }}>
            Help buyers and sellers know who you are. You can always edit this later.
          </p>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
              background: '#f1f5f9',
              border: `2px dashed ${avatarPreview ? '#16a34a' : '#d1d5db'}`,
              cursor: 'pointer', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.18s',
            }}
            aria-label="Upload avatar"
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Avatar preview" fill style={{ objectFit: 'cover' }} />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9ca3af" style={{ width: 32, height: 32 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
          </button>
          <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Click to upload photo <span style={{ color: '#d1d5db' }}>· optional</span></p>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        {/* Bio */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="bio" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Bio <span style={{ color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={200}
            placeholder="Tell buyers a little about yourself…"
            value={bio}
            onChange={e => setBio(e.target.value)}
            disabled={loading}
            className="input-field"
            style={{ resize: 'none', fontFamily: 'inherit' }}
          />
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>{bio.length}/200</p>
        </div>

        {/* Gender */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gender <span style={{ color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GENDER_OPTIONS.map(option => (
              <label
                key={option.value}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderRadius: 'var(--radius-sm)',
                  border: `1.5px solid ${gender === option.value ? '#16a34a' : '#e5e7eb'}`,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: gender === option.value ? 600 : 400,
                  color: gender === option.value ? '#15803d' : '#4b5563',
                  background: gender === option.value ? '#f0fdf4' : '#fff',
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={gender === option.value}
                  onChange={() => setGender(option.value)}
                  disabled={loading}
                  style={{ display: 'none' }}
                />
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${gender === option.value ? '#16a34a' : '#d1d5db'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {gender === option.value && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'block' }} />
                  )}
                </span>
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', fontSize: '0.85rem', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading}
            className="btn-primary-light"
            style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
          >
            {loading && (
              <svg className="animate-spin" style={{ width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? 'Saving…' : 'Save & continue →'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading}
            style={{ width: '100%', padding: '10px', fontSize: '0.85rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
