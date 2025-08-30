'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

type MapItem = {
  id: string
  title: string
  location: string
  imageUrl?: string
  price?: number
}

interface MapViewProps {
  items: MapItem[]
  activeItemId?: string | null
}

// Fix default marker icons in Next.js (client-only)
function FixMarkerIconsOnce() {
  useEffect(() => {
    let cancelled = false
    import('leaflet').then(({ default: L }) => {
      if (cancelled) return
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })
    })
    return () => { cancelled = true }
  }, [])
  return null
}

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false }) as any
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false }) as any
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false }) as any
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false }) as any

type LatLng = { lat: number; lng: number }

const geocodeCache = new Map<string, LatLng>()

async function geocode(query: string): Promise<LatLng | null> {
  const cached = geocodeCache.get(query)
  if (cached) return cached

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'roomvia-app/1.0 (contact: support@roomvia)' },
    })
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      const { lat, lon } = data[0]
      const coords = { lat: parseFloat(lat), lng: parseFloat(lon) }
      geocodeCache.set(query, coords)
      return coords
    }
  } catch (e) {
    console.error('Geocoding failed for', query, e)
  }
  return null
}

export default function MapView({ items, activeItemId }: MapViewProps) {
  const [positions, setPositions] = useState<Record<string, LatLng>>({})
  const [activeCoords, setActiveCoords] = useState<LatLng | null>(null)
  const isMountedRef = useRef(false)
  const mapRef = useRef<any>(null)

  // Prefetch geocodes lazily in the background
  useEffect(() => {
    isMountedRef.current = true
    ;(async () => {
      for (const item of items) {
        if (positions[item.id]) continue
        const coords = await geocode(item.location)
        if (coords && isMountedRef.current) {
          setPositions(prev => ({ ...prev, [item.id]: coords }))
        }
      }
    })()
    return () => {
      isMountedRef.current = false
    }
  }, [items])

  // Update active coords when hovered item changes
  useEffect(() => {
    if (!activeItemId) {
      setActiveCoords(null)
      return
    }
    const coords = positions[activeItemId]
    if (coords) {
      setActiveCoords(coords)
    } else {
      const target = items.find(i => i.id === activeItemId)
      if (target) {
        geocode(target.location).then(c => {
          if (c) {
            setPositions(prev => ({ ...prev, [target.id]: c }))
            setActiveCoords(c)
          }
        })
      }
    }
  }, [activeItemId, positions, items])

  const markers = useMemo(() => {
    return items
      .map(item => ({ item, coords: positions[item.id] }))
      .filter(m => !!m.coords) as { item: MapItem; coords: LatLng }[]
  }, [items, positions])

  const defaultCenter: LatLng = { lat: 12.9716, lng: 77.5946 } // Bangalore

  return (
    <div className="w-full h-[400px] lg:h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <MapContainer whenCreated={(map: any) => { mapRef.current = map }} center={[defaultCenter.lat, defaultCenter.lng]} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <FixMarkerIconsOnce />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ item, coords }) => (
          <Marker key={item.id} position={[coords.lat, coords.lng]}>
            <Popup closeButton={false} offset={[0, -8]}>
              <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="flex">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-16 w-24 object-cover flex-shrink-0"
                    />
                  )}
                  <div className="p-3">
                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{item.location}</div>
                    {typeof item.price === 'number' && (
                      <div className="mt-1 text-sm text-gray-900">
                        ₹{item.price.toLocaleString('en-IN')} <span className="text-xs text-gray-500">/month</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {/* Fly to active coords */}
        {activeCoords && mapRef.current && mapRef.current.flyTo([activeCoords.lat, activeCoords.lng], 14, { duration: 0.6 })}
      </MapContainer>
    </div>
  )
}


