'use client'

import { useState } from 'react'
import { deleteDraftListing } from './actions'

export default function DeleteListingButton({ listingId }: { listingId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      await deleteDraftListing(listingId)
      // Page revalidates automatically via Server Action — no client redirect needed
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
      setLoading(false)
      setConfirming(false)
    }
  }

  if (error) {
    return <span className="text-xs text-red-500">{error}</span>
  }

  if (confirming) {
    return (
      <span className="inline-flex gap-2 items-center">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          {loading ? 'Deleting…' : 'Confirm delete'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium text-red-500 hover:text-red-700 ml-3"
    >
      Delete
    </button>
  )
}
