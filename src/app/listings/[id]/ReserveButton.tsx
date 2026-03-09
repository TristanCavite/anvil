'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReservation } from 'app/reservations/actions'

export default function ReserveButton({
  listingId,
  isSoldOut,
}: {
  listingId: string
  isSoldOut: boolean
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleReserve() {
    setLoading(true)
    setError(null)
    try {
      await createReservation(listingId)
      router.push('/reservations')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  if (isSoldOut) {
    return (
      <button disabled className="w-full rounded-xl bg-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-500 cursor-not-allowed">
        Sold out
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleReserve}
        disabled={loading}
        className="w-full rounded-xl bg-green-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {loading ? 'Reserving…' : 'Reserve this item'}
      </button>
      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  )
}
