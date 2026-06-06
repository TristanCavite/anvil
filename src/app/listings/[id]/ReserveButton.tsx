'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createReservation } from 'app/reservations/actions'

export default function ReserveButton({
  listingId,
  isSoldOut,
  maxQuantity,
}: {
  listingId: string
  isSoldOut: boolean
  maxQuantity: number
}) {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [quantity, setQuantity] = useState('1')

  async function handleReserve() {
    setLoading(true)
    setError(null)
    try {
      await createReservation(listingId, Number(quantity))
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
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
        <label htmlFor="reservation-quantity" className="text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          id="reservation-quantity"
          type="number"
          min="1"
          max={maxQuantity}
          step="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={loading}
          className="input-global text-center border-gray=300"
        />
        <span className="text-xs text-gray-500">
          Max {maxQuantity}
        </span>
      </div>
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
