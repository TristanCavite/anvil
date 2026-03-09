'use client'

import { useState } from 'react'
import {
  acceptReservation,
  declineReservation,
  fulfillReservation,
} from './actions'

interface Props {
  reservationId: string
  status: string
}

export default function ReservationActions({ reservationId, status }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function run(action: () => Promise<void>, label: string) {
    setLoading(label)
    setError(null)
    try {
      await action()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-1.5 items-end">
      {status === 'authorized' && (
        <>
          <button
            onClick={() => run(() => acceptReservation(reservationId), 'accept')}
            disabled={!!loading}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition"
          >
            {loading === 'accept' ? 'Accepting…' : 'Accept'}
          </button>
          <button
            onClick={() => run(() => declineReservation(reservationId), 'decline')}
            disabled={!!loading}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
          >
            {loading === 'decline' ? 'Declining…' : 'Decline'}
          </button>
        </>
      )}
      {status === 'accepted' && (
        <button
          onClick={() => run(() => fulfillReservation(reservationId), 'fulfill')}
          disabled={!!loading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading === 'fulfill' ? 'Marking…' : 'Mark as fulfilled'}
        </button>
      )}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
