'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from 'lib/supabase/browser'

const CATEGORIES = [
  'Baked Goods',
  'Fruits & Vegetables',
  'Cooked Meals',
  'Dairy & Eggs',
  'Beverages',
  'Snacks',
  'Grains & Cereals',
  'Condiments & Sauces',
  'Seafood',
  'Meat',
  'Other',
]

const MAX_PHOTOS = 5
const MAX_PHOTO_MB = 5

interface ExistingPhoto { id: string; url: string; sort_order: number }
interface NewPhoto { file: File; preview: string }

// Status a seller is allowed to set
const SELLER_STATUSES = ['draft', 'active', 'removed'] as const
type SellerStatus = typeof SELLER_STATUSES[number]

const STATUS_LABELS: Record<SellerStatus, string> = {
  draft:   'Draft',
  active:  'Active (visible to buyers)',
  removed: 'Remove listing',
}

export default function EditListingPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router   = useRouter()
  const fileRef  = useRef<HTMLInputElement>(null)
  const { id: listingId } = params

  // Form state
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]     = useState(CATEGORIES[0])
  const [price, setPrice]           = useState('')
  const [quantity, setQuantity]     = useState('1')
  const [pickupStart, setPickupStart] = useState('')
  const [pickupEnd, setPickupEnd]   = useState('')
  const [status, setStatus]         = useState<SellerStatus>('draft')

  // Photos
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([])
  const [newPhotos, setNewPhotos]   = useState<NewPhoto[]>([])

  // UI
  const [sellerId, setSellerId]     = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [fetching, setFetching]     = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // ─── Load listing ───────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/sign-in'); return }

      const { data: biz } = await supabase
        .from('seller_business')
        .select('id')
        .eq('owner_id', user.id)
        .single()
      if (!biz) { router.push('/seller/onboarding'); return }
      setSellerId(biz.id)

      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('*, listing_photos(id, url, sort_order)')
        .eq('id', listingId)
        .eq('seller_id', biz.id)
        .single()

      if (fetchError || !listing) { router.push('/seller/listings'); return }

      setTitle(listing.title ?? '')
      setDescription(listing.description ?? '')
      setCategory(listing.category ?? CATEGORIES[0])
      setPrice(String(listing.price ?? ''))
      setQuantity(String(listing.quantity ?? 1))
      setPickupStart(listing.pickup_start ? listing.pickup_start.slice(0, 16) : '')
      setPickupEnd(listing.pickup_end   ? listing.pickup_end.slice(0, 16)   : '')
      setStatus((listing.status as SellerStatus) ?? 'draft')

      const photos: ExistingPhoto[] = (listing.listing_photos ?? [])
        .sort((a: ExistingPhoto, b: ExistingPhoto) => a.sort_order - b.sort_order)
      setExistingPhotos(photos)
      setFetching(false)
    }
    load()
  }, [listingId])

  useEffect(() => {
    return () => newPhotos.forEach(p => URL.revokeObjectURL(p.preview))
  }, [newPhotos])

  // ─── Photo helpers ──────────────────────────────────────────────────────
  const totalPhotos = existingPhotos.length - removedPhotoIds.length + newPhotos.length

  function handlePhotoFiles(files: FileList) {
    setPhotoError(null)
    const remaining = MAX_PHOTOS - totalPhotos
    const toAdd = Array.from(files).slice(0, remaining)

    for (const file of toAdd) {
      if (!file.type.startsWith('image/')) { setPhotoError('Only image files allowed.'); return }
      if (file.size > MAX_PHOTO_MB * 1024 * 1024) { setPhotoError(`Max ${MAX_PHOTO_MB} MB per photo.`); return }
    }
    const previews = toAdd.map(file => ({ file, preview: URL.createObjectURL(file) }))
    setNewPhotos(prev => [...prev, ...previews])
  }

  function removeExisting(id: string) { setRemovedPhotoIds(prev => [...prev, id]) }
  function removeNew(i: number) {
    setNewPhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i) })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files.length) handlePhotoFiles(e.dataTransfer.files)
  }

  // ─── Submit ────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sellerId) return
    setError(null)
    setLoading(true)

    try {
      // 1. Update listing row
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title:        title.trim(),
          description:  description.trim() || null,
          category,
          price:        parseFloat(price),
          quantity:     parseInt(quantity, 10),
          pickup_start: pickupStart || null,
          pickup_end:   pickupEnd   || null,
          status,
        })
        .eq('id', listingId)
        .eq('seller_id', sellerId)

      if (updateError) throw new Error(updateError.message)

      // 2. Delete removed photos (DB row + storage)
      for (const photoId of removedPhotoIds) {
        const photo = existingPhotos.find(p => p.id === photoId)
        if (photo) {
          // Extract storage path from URL
          const url = new URL(photo.url)
          const storagePath = url.pathname.split('/listing-photos/')[1]
          if (storagePath) {
            await supabase.storage.from('listing-photos').remove([storagePath])
          }
        }
        await supabase.from('listing_photos').delete().eq('id', photoId)
      }

      // 3. Upload new photos
      const currentSortMax = existingPhotos
        .filter(p => !removedPhotoIds.includes(p.id))
        .reduce((max, p) => Math.max(max, p.sort_order), -1)

      for (let i = 0; i < newPhotos.length; i++) {
        const photo = newPhotos[i]
        const ext   = photo.file.name.split('.').pop() ?? 'jpg'
        const path  = `${listingId}/${Date.now()}_${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('listing-photos')
          .upload(path, photo.file, { upsert: false })
        if (uploadError) throw new Error(`Photo upload failed: ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from('listing-photos').getPublicUrl(path)
        await supabase.from('listing_photos').insert({
          listing_id: listingId,
          url:        urlData.publicUrl,
          sort_order: currentSortMax + 1 + i,
        })
      }

      router.push('/seller/listings')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setLoading(false)
    }
  }

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    )
  }

  const visibleExisting = existingPhotos.filter(p => !removedPhotoIds.includes(p.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/seller/listings" className="text-sm text-gray-500 hover:text-gray-700">← My listings</Link>
        <h1 className="text-base font-semibold text-gray-900">Edit listing</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* ── Photos ── */}
          <section className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Photos</h2>
            <p className="text-xs text-gray-500 mb-4">Up to {MAX_PHOTOS} photos · first photo is the cover</p>

            {totalPhotos < MAX_PHOTOS && (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-8 px-4 cursor-pointer hover:border-green-500 hover:bg-green-50/40 transition mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mb-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-green-600">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WEBP — max {MAX_PHOTO_MB} MB each</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={e => e.target.files && handlePhotoFiles(e.target.files)}
                />
              </div>
            )}

            {(visibleExisting.length > 0 || newPhotos.length > 0) && (
              <div className="grid grid-cols-5 gap-3">
                {visibleExisting.map((p, i) => (
                  <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image src={p.url} alt="" fill className="object-cover" />
                    {i === 0 && newPhotos.length === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] font-semibold bg-green-600 text-white rounded px-1 py-0.5">Cover</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button type="button" onClick={() => removeExisting(p.id)} className="text-red-300 hover:text-red-100" title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
                {newPhotos.map((p, i) => (
                  <div key={p.preview} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image src={p.preview} alt="" fill className="object-cover" />
                    <span className="absolute top-1 left-1 text-[10px] font-semibold bg-blue-600 text-white rounded px-1 py-0.5">New</span>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button type="button" onClick={() => removeNew(i)} className="text-red-300 hover:text-red-100" title="Remove">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {photoError && <p className="mt-3 text-xs text-red-600">{photoError}</p>}
          </section>

          {/* ── Details ── */}
          <section className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-800">Details</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="title">Title *</label>
              <input id="title" type="text" required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} disabled={loading}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="description">Description</label>
              <textarea id="description" rows={3} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} disabled={loading}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 resize-none" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="category">Category *</label>
              <select id="category" required value={category} onChange={e => setCategory(e.target.value)} disabled={loading}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50 bg-white">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="price">Price (PHP) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">₱</span>
                  <input id="price" type="number" required min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} disabled={loading}
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-3.5 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="quantity">Quantity *</label>
                <input id="quantity" type="number" required min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={loading}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50" />
              </div>
            </div>
          </section>

          {/* ── Pickup window ── */}
          <section className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-gray-800">Pickup window</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="pickupStart">From</label>
                <input id="pickupStart" type="datetime-local" value={pickupStart} onChange={e => setPickupStart(e.target.value)} disabled={loading}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700" htmlFor="pickupEnd">Until</label>
                <input id="pickupEnd" type="datetime-local" value={pickupEnd} min={pickupStart} onChange={e => setPickupEnd(e.target.value)} disabled={loading}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-50" />
              </div>
            </div>
          </section>

          {/* ── Status ── */}
          <section className="bg-white rounded-2xl border border-gray-200 px-6 py-5 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-gray-800">Listing status</h2>
            <div className="flex flex-col gap-2">
              {SELLER_STATUSES.map(s => (
                <label
                  key={s}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition ${status === s ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-green-600"
                  />
                  <div>
                    <p className={`text-sm font-medium ${s === 'removed' ? 'text-red-600' : 'text-gray-800'}`}>{STATUS_LABELS[s]}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3 pb-2">
            <Link href="/seller/listings" className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 text-center hover:bg-gray-50 transition">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !sellerId}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {loading ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
