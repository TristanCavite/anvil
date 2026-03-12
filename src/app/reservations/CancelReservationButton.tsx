'use client'

import { useState } from 'react'
import { cancelReservation } from 'app/reservations/actions'

export default function CancelReservationButton({ reservationId }: { reservationId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)
    try {
      await cancelReservation(reservationId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to cancel')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex gap-2 items-center">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {loading ? 'Cancelling…' : 'Confirm cancel'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-gray-400 hover:text-gray-600">
          Keep
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-500 hover:text-red-700"
    >
      Cancel
    </button>
  )
}
