'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { OpenLocationCode } from 'open-location-code'

// Module-level instance — the runtime library uses instance methods,
// despite @types/open-location-code declaring them as static.
const olc = new OpenLocationCode()

// Fix default Leaflet marker icons broken by webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export interface LocationResult {
  lat: number
  lng: number
  plus_code: string
  address_line: string
  city: string
  province: string
  postal_code: string
}

interface Props {
  initialLat?: number
  initialLng?: number
  onConfirm: (result: LocationResult) => void
  onClose: () => void
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  address: {
    road?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    municipality?: string
    state?: string
    postcode?: string
  }
}

// Inner component: moves map to a center + zoom
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

// Inner component: handle map click to move marker
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function buildAddress(addr: NominatimResult['address']): Omit<LocationResult, 'lat' | 'lng' | 'plus_code'> {
  const address_line = [addr.road, addr.suburb ?? addr.neighbourhood].filter(Boolean).join(', ')
  const city         = addr.city ?? addr.town ?? addr.municipality ?? ''
  const province     = addr.state ?? ''
  const postal_code  = addr.postcode ?? ''
  return { address_line, city, province, postal_code }
}

// Philippines center — last-resort fallback
const DEFAULT_CENTER: [number, number] = [12.8797, 121.7740]
const ZOOM_COUNTRY   = 6   // whole Philippines
const ZOOM_CITY      = 13  // IP geolocation (city level)
const ZOOM_BARANGAY  = 15  // GPS hit (barangay level)

export default function LocationPickerModal({ initialLat, initialLng, onConfirm, onClose }: Props) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
  )
  const [mapZoom, setMapZoom]     = useState(initialLat ? ZOOM_BARANGAY : ZOOM_COUNTRY)
  const [search, setSearch]         = useState('')
  const [searching, setSearching]   = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [addressFields, setAddressFields] = useState<Omit<LocationResult, 'lat' | 'lng' | 'plus_code'>>({
    address_line: '', city: '', province: '', postal_code: '',
  })
  const [locating, setLocating]     = useState(false)
  const [geoError, setGeoError]     = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Declared first so requestCurrentLocation can reference it
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (!res.ok) return
      const data: NominatimResult = await res.json()
      setAddressFields(buildAddress(data.address))
      setSearch(data.display_name)
    } catch {
      // Silently fail — address fields stay empty for manual edit
    }
  }, [])

  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude
        const lng = coords.longitude
        setMarkerPos([lat, lng])
        setMapCenter([lat, lng])
        setMapZoom(ZOOM_BARANGAY)
        reverseGeocode(lat, lng)
        setLocating(false)
      },
      () => {
        setGeoError('Could not get your location. Allow location access or search manually.')
        setLocating(false)
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }, [reverseGeocode])

  // On first open: use IP geolocation (instant, no permission) to center at city
  // level, then GPS refines to barangay level.
  useEffect(() => {
    if (initialLat && initialLng) return // editing existing location — skip

    async function centerByIP() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        if (!res.ok) return
        const data = await res.json()
        if (data.latitude && data.longitude) {
          setMapCenter([data.latitude, data.longitude])
          setMapZoom(ZOOM_CITY)
        }
      } catch {
        // Silent — Philippines fallback already set
      }
    }

    centerByIP()
    requestCurrentLocation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleMarkerMove(lat: number, lng: number) {
    setMarkerPos([lat, lng])
    reverseGeocode(lat, lng)
  }

  async function handleSearch() {
    if (!search.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1&countrycodes=ph`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const results: NominatimResult[] = await res.json()
      if (!results.length) {
        setSearchError('No results found. Try a different address.')
        setSearching(false)
        return
      }
      const { lat, lon, address } = results[0]
      const parsedLat = parseFloat(lat)
      const parsedLng = parseFloat(lon)
      setMarkerPos([parsedLat, parsedLng])
      setMapCenter([parsedLat, parsedLng])
      setAddressFields(buildAddress(address))
    } catch {
      setSearchError('Search failed. Check your connection and try again.')
    }
    setSearching(false)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
      handleSearch()
    }
  }

  function handleConfirm() {
    if (!markerPos) return
    const [lat, lng] = markerPos
    // @ts-ignore — @types/open-location-code wrongly declares encode as static; runtime uses instance method
    const plus_code  = olc.encode(lat, lng, 10)
    onConfirm({ lat, lng, plus_code, ...addressFields })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Set your business location</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search address…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
            {/* Use my location button */}
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={locating}
              title="Use my current location"
              className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 hover:border-green-500 hover:text-green-600 transition disabled:opacity-50"
            >
              {locating ? (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M3 12H4.5M19.5 12H21M6.343 6.343l1.06 1.06M16.596 16.596l1.061 1.061M6.343 17.657l1.06-1.06M16.596 7.404l1.061-1.061M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {searching ? (
                <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              )}
              Search
            </button>
          </div>
          {searchError && (
            <p className="mt-1.5 text-xs text-red-500">{searchError}</p>
          )}
          {geoError && (
            <p className="mt-1.5 text-xs text-orange-500">{geoError}</p>
          )}
          <p className="mt-1.5 text-xs text-gray-400">
            Location may be approximate (especially on WiFi). Drag the pin or click the map to set your exact spot.
          </p>
        </div>

        {/* Map */}
        <div className="relative flex-1 min-h-[300px]">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            className="w-full h-full min-h-[300px]"
            style={{ zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />
            <ClickHandler onClick={handleMarkerMove} />
            {markerPos && (
              <Marker
                position={markerPos}
                icon={defaultIcon}
                draggable
                eventHandlers={{
                  dragend(e) {
                    const { lat, lng } = (e.target as L.Marker).getLatLng()
                    handleMarkerMove(lat, lng)
                  },
                }}
              />
            )}
          </MapContainer>
          {!markerPos && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="bg-white/80 rounded-xl px-4 py-2 text-sm text-gray-500 shadow flex items-center gap-2">
                {locating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Finding your location…
                  </>
                ) : (
                  'Search or click the map to drop a pin'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Address fields */}
        <div className="px-6 py-4 border-t border-gray-100 grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Address line</label>
            <input
              type="text"
              value={addressFields.address_line}
              onChange={e => setAddressFields(f => ({ ...f, address_line: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">City / Municipality</label>
            <input
              type="text"
              value={addressFields.city}
              onChange={e => setAddressFields(f => ({ ...f, city: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Province / Region</label>
            <input
              type="text"
              value={addressFields.province}
              onChange={e => setAddressFields(f => ({ ...f, province: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Postal code</label>
            <input
              type="text"
              value={addressFields.postal_code}
              onChange={e => setAddressFields(f => ({ ...f, postal_code: e.target.value }))}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>
          {markerPos && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Plus Code</label>
              <p className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600 font-mono">
              {/* @ts-ignore — instance method, types package is wrong */}
                {olc.encode(markerPos[0], markerPos[1], 10)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!markerPos}
            className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm location
          </button>
        </div>

      </div>
    </div>
  )
}
