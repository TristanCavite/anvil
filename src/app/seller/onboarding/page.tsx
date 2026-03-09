'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from 'lib/supabase/browser'
import type { LocationResult } from 'app/components/map/LocationPickerModal'

// Leaflet must be loaded client-side only (no SSR — it accesses window)
const LocationPickerModal = dynamic(
  () => import('app/components/map/LocationPickerModal'),
  { ssr: false }
)

export default function SellerOnboardingPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [businessName, setBusinessName] = useState('')
  const [location, setLocation]         = useState<LocationResult | null>(null)
  const [showMap, setShowMap]           = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [checkingProfile, setCheckingProfile] = useState(true)

  // Redirect away if already a seller
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_seller')
        .eq('id', user.id)
        .single()

      if (profile?.is_seller) {
        router.push('/seller/listings')
        return
      }
      setCheckingProfile(false)
    }
    check()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!location) { setError('Please set your business location.'); return }
    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/sign-in'); return }

    // 1. Set is_seller = true on profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('id', user.id)

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    // 2. Create seller_business row
    const { error: bizError } = await supabase
      .from('seller_business')
      .insert({
        owner_id:     user.id,
        business_name: businessName.trim(),
        address_line: location.address_line,
        city:         location.city,
        province:     location.province,
        postal_code:  location.postal_code,
        lat:          location.lat,
        lng:          location.lng,
        plus_code:    location.plus_code,
      })

    if (bizError) {
      setError(bizError.message)
      setLoading(false)
      return
    }

    router.push('/seller/listings')
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="w-6 h-6 animate-spin text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      {showMap && (
        <LocationPickerModal
          initialLat={location?.lat}
          initialLng={location?.lng}
          onConfirm={result => { setLocation(result); setShowMap(false) }}
          onClose={() => setShowMap(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M5.223 2.25c-.497 0-.974.198-1.325.55l-1.3 1.298A3.75 3.75 0 0 0 7.5 9.75c.627.47 1.406.75 2.25.75.844 0 1.624-.28 2.25-.75.626.47 1.406.75 2.25.75.844 0 1.623-.28 2.25-.75a3.75 3.75 0 0 0 4.902-5.652l-1.3-1.299a1.875 1.875 0 0 0-1.325-.549H5.223Z" />
              <path fillRule="evenodd" d="M3 20.25v-8.755c1.42.674 3.08.673 4.5 0A5.234 5.234 0 0 0 9.75 12c.804 0 1.568-.182 2.25-.506a5.234 5.234 0 0 0 2.25.506c.804 0 1.567-.182 2.25-.506 1.42.674 3.08.675 4.5.001v8.755h.75a.75.75 0 0 1 0 1.5H2.25a.75.75 0 0 1 0-1.5H3Zm3-6a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75v-3Zm8.25-.75a.75.75 0 0 0-.75.75v5.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75v-5.25a.75.75 0 0 0-.75-.75h-3Z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Set up your seller account</h1>
          <p className="text-sm text-gray-500 mt-1">Tell buyers about your business and where to pick up.</p>
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Business name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                Business name
              </label>
              <input
                id="businessName"
                type="text"
                required
                placeholder="e.g. Maria's Bakery"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50"
              />
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Pickup location</label>
              {location ? (
                <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span className="font-medium text-green-800">Location set</span>
                    <span className="text-green-700">
                      {[location.address_line, location.city, location.province].filter(Boolean).join(', ')}
                    </span>
                    <span className="text-xs text-green-600 font-mono mt-0.5">{location.plus_code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="text-xs font-medium text-green-700 hover:text-green-900 whitespace-nowrap"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-2.5 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-green-500 hover:text-green-600 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  Set location on map
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Setting up…' : 'Start selling'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
