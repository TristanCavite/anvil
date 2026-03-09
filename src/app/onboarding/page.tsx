'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

  const [avatarFile, setAvatarFile]     = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bio, setBio]                   = useState('')
  const [gender, setGender]             = useState<Gender | ''>('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

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
    if (!user) {
      router.push('/sign-in')
      return
    }

    let avatarUrl: string | null = null

    // Upload avatar if provided
    if (!skip && avatarFile) {
      const ext      = avatarFile.name.split('.').pop()
      const path     = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })

      if (uploadError) {
        setError('Failed to upload avatar. Please try again.')
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      avatarUrl = publicUrl
    }

    // Update profile
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
            <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
            <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Set up your profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Help buyers and sellers know who you are. You can always edit this later.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 flex flex-col gap-6">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-green-500 transition flex items-center justify-center group"
            aria-label="Upload avatar"
          >
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            </div>
          </button>
          <p className="text-xs text-gray-400">Click to upload a photo (optional)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-gray-700">
            Bio <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="bio"
            rows={3}
            maxLength={200}
            placeholder="Tell buyers a little about yourself…"
            value={bio}
            onChange={e => setBio(e.target.value)}
            disabled={loading}
            className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 text-right">{bio.length}/200</p>
        </div>

        {/* Gender */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">
            Gender <span className="text-gray-400 font-normal">(optional)</span>
          </span>
          <div className="grid grid-cols-2 gap-2">
            {GENDER_OPTIONS.map(option => (
              <label
                key={option.value}
                className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 cursor-pointer transition text-sm select-none ${
                  gender === option.value
                    ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={gender === option.value}
                  onChange={() => setGender(option.value)}
                  disabled={loading}
                  className="sr-only"
                />
                {gender === option.value ? (
                  <span className="w-4 h-4 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </span>
                ) : (
                  <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                )}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? 'Saving…' : 'Save & continue'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={loading}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1.5 transition disabled:cursor-not-allowed"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
