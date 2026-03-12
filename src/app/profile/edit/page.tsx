'use client'

import { useState, useEffect, useRef } from 'react'
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

export default function EditProfilePage() {
  const supabase = createClient()
  const router   = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [initialLoad, setInitialLoad]     = useState(true)
  const [avatarFile, setAvatarFile]       = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const [displayName, setDisplayName]     = useState('')
  const [phone, setPhone]                 = useState('')
  const [bio, setBio]                     = useState('')
  const [gender, setGender]               = useState<Gender | ''>('')
  
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, bio, gender, phone')
        .eq('id', user.id)
        .single()

      if (profile) {
        setDisplayName(profile.display_name || user.user_metadata?.full_name || '')
        setAvatarPreview(profile.avatar_url || null)
        setBio(profile.bio || '')
        setGender((profile.gender as Gender) || '')
        setPhone(profile.phone || '')
      }
      setInitialLoad(false)
    }
    fetchProfile()
  }, [router, supabase])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required.')
      return
    }

    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    let avatarUrl: string | null = avatarPreview && !avatarFile ? avatarPreview : null

    if (avatarFile) {
      const ext  = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar-${Date.now()}.${ext}`
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

    // Update auth metadata for display name
    await supabase.auth.updateUser({
      data: { full_name: displayName.trim() }
    })

    const updates: Record<string, unknown> = {
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
      bio: bio.trim() || null,
      gender: gender || null,
      phone: phone.trim() || null,
      updated_at: new Date().toISOString()
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

    router.push('/profile')
    router.refresh()
  }

  if (initialLoad) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg className="animate-spin" style={{ width: 24, height: 24, color: '#16a34a' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px' }}>

      {/* Header */}
      <div style={{ maxWidth: 540, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', transition: 'color 0.15s' }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Profile
        </Link>
      </div>

      <div style={{
        width: '100%', maxWidth: 540, margin: '0 auto',
        background: '#fff',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 32px rgba(0,0,0,0.04)',
        padding: '36px 32px',
      }}>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 28 }}>
          Edit Profile
        </h1>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Avatar Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Avatar preview" fill style={{ objectFit: 'cover' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9ca3af" style={{ width: 32, height: 32 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-ghost"
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
              >
                Change photo
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => { setAvatarPreview(null); setAvatarFile(null) }}
                  style={{ marginLeft: 10, padding: '6px', fontSize: '0.8rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                >
                  Remove
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
          </div>

          <div style={{ height: 1, background: '#f1f5f9' }} />

          {/* Display Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="displayName" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Display name
            </label>
            <input
              id="displayName" type="text" required autoComplete="name" value={displayName}
              onChange={e => setDisplayName(e.target.value)} disabled={loading}
              className="input-field"
            />
          </div>

          {/* Phone */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="phone" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phone Number <span style={{ color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="phone" type="tel" autoComplete="tel" value={phone} placeholder="+63 912 345 6789"
              onChange={e => setPhone(e.target.value)} disabled={loading}
              className="input-field"
            />
          </div>

          {/* Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="bio" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Bio <span style={{ color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="bio" rows={4} maxLength={200} placeholder="Tell buyers a little about yourself…" value={bio}
              onChange={e => setBio(e.target.value)} disabled={loading}
              className="input-field" style={{ resize: 'none', fontFamily: 'inherit' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'right' }}>{bio.length}/200</p>
          </div>

          {/* Gender */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gender <span style={{ color: '#9ca3af', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 8 }}>
              {GENDER_OPTIONS.map(option => (
                <label
                  key={option.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${gender === option.value ? '#16a34a' : '#e5e7eb'}`,
                    padding: '8px 12px',
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
                    type="radio" name="gender" value={option.value} checked={gender === option.value}
                    onChange={() => setGender(option.value)} disabled={loading} style={{ display: 'none' }}
                  />
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${gender === option.value ? '#16a34a' : '#d1d5db'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {gender === option.value && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'block' }} />}
                  </span>
                  {option.label}
                </label>
              ))}
            </div>
            {gender && (
               <button
                 type="button"
                 onClick={() => setGender('')}
                 style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', padding: 0, marginTop: 4, fontWeight: 500 }}
               >
                 Clear selection
               </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ borderRadius: 'var(--radius-sm)', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', fontSize: '0.85rem', color: '#b91c1c' }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
            <Link
              href="/profile"
              className="btn-ghost"
              style={{ flex: 1, padding: '12px', fontSize: '0.9rem', textAlign: 'center', border: '1px solid #e2e8f0', background: '#fff' }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-light"
              style={{ flex: 1, padding: '12px', fontSize: '0.9rem' }}
            >
              {loading && (
                <svg className="animate-spin" style={{ width: 16, height: 16, marginRight: 8, display: 'inline-block' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
