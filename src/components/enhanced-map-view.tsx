'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { Map as LeafletMap } from 'leaflet'

type MapItem = {
  id: string
  title: string
  location: string
  imageUrl?: string
  price?: number
  roomType?: string
  tags?: string[]
}

interface EnhancedMapViewProps {
  items: MapItem[]
  activeItemId?: string | null
  onItemHover?: (itemId: string | null) => void
  className?: string
}

// Fix default marker icons in Next.js (client-only)
function FixMarkerIconsOnce() {
  useEffect(() => {
    let cancelled = false
    import('leaflet').then(({ default: L }) => {
      if (cancelled) return
      
      // Custom marker icons
      const createCustomIcon = (color: string, isActive: boolean = false) => {
        const size = isActive ? 35 : 25
        const anchor = isActive ? [17, 35] : [12, 25]
        
        return L.divIcon({
          html: `
            <div style="
              background-color: ${color};
              width: ${size}px;
              height: ${size}px;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: ${isActive ? '16px' : '12px'};
              transition: all 0.2s ease;
              cursor: pointer;
              ${isActive ? 'transform: scale(1.1); z-index: 1000;' : ''}
            ">
              ₹
            </div>
          `,
          className: 'custom-marker',
          iconSize: [size, size],
          iconAnchor: anchor as [number, number],
          popupAnchor: [0, -size]
        })
      }

      // Override default icons
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      // Store custom icon creator globally
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).createCustomIcon = createCustomIcon
    })
    return () => { cancelled = true }
  }, [])
  return null
}

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

type LatLng = { lat: number; lng: number }

// Enhanced geocoding with persistent caching and better rate limiting
const geocodeCache = new Map<string, { coords: LatLng | null; timestamp: number }>()
const GEOCODE_CACHE_EXPIRATION = 24 * 60 * 60 * 1000 // 24 hours for successful results
const FAILED_CACHE_EXPIRATION = 5 * 60 * 1000 // 5 minutes for failed results (allow quick retry)
const failedQueries = new Set<string>()
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000 // Minimum 1 second between requests

// Load cache from localStorage on initialization
const loadCacheFromStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const stored = localStorage.getItem('roomvia-geocode-cache')
    if (stored) {
      const parsed = JSON.parse(stored)
      const now = Date.now()
      
      // Load valid cache entries
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        const expiration = value.coords ? GEOCODE_CACHE_EXPIRATION : FAILED_CACHE_EXPIRATION
        if (now - value.timestamp < expiration) {
          geocodeCache.set(key, value)
          if (!value.coords) {
            failedQueries.add(key)
          }
        }
      })
    }
  } catch (error) {
    console.warn('Failed to load geocode cache from storage:', error)
  }
}

// Save cache to localStorage
const saveCacheToStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const cacheObject = Object.fromEntries(geocodeCache.entries())
    localStorage.setItem('roomvia-geocode-cache', JSON.stringify(cacheObject))
  } catch (error) {
    console.warn('Failed to save geocode cache to storage:', error)
  }
}

// Initialize cache from storage
loadCacheFromStorage()

async function geocode(query: string): Promise<LatLng | null> {
  // Check if query previously failed recently
  if (failedQueries.has(query)) {
    const cached = geocodeCache.get(query)
    if (cached && (Date.now() - cached.timestamp) < FAILED_CACHE_EXPIRATION) {
      return null
    } else {
      // Remove from failed queries if enough time has passed
      failedQueries.delete(query)
    }
  }

  // Check cache
  const cached = geocodeCache.get(query)
  const now = Date.now()
  
  if (cached) {
    const expiration = cached.coords ? GEOCODE_CACHE_EXPIRATION : FAILED_CACHE_EXPIRATION
    if ((now - cached.timestamp) < expiration) {
      return cached.coords
    }
  }

  // Rate limiting: ensure minimum interval between requests
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }

  try {
    lastRequestTime = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' }, // User-Agent is forbidden in browsers and causes CORS failures
      signal: controller.signal,
      mode: 'cors',
      referrerPolicy: 'no-referrer'
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()
    
    if (Array.isArray(data) && data.length > 0) {
      const { lat, lon } = data[0]
      const coords = { lat: parseFloat(lat), lng: parseFloat(lon) }
      
      // Cache successful result
      geocodeCache.set(query, { coords, timestamp: Date.now() })
      failedQueries.delete(query) // Remove from failed queries if it was there
      saveCacheToStorage()
      return coords
    } else {
      // Cache null result to avoid repeated failed requests
      geocodeCache.set(query, { coords: null, timestamp: Date.now() })
      failedQueries.add(query)
      saveCacheToStorage()
      return null
    }
  } catch (error) {
    console.warn('Geocoding failed for', query, error)
    
    // Cache failure and add to failed queries
    geocodeCache.set(query, { coords: null, timestamp: Date.now() })
    failedQueries.add(query)
    saveCacheToStorage()
    return null
  }
}

export default function EnhancedMapView({ 
  items, 
  activeItemId, 
  onItemHover, 
  className = "" 
}: EnhancedMapViewProps) {
  const [positions, setPositions] = useState<Record<string, LatLng>>({})
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const isMountedRef = useRef(false)
  const markersRef = useRef<Record<string, unknown>>({})
  const debounceTimerRef = useRef<number | null>(null)
  const lastActiveIdRef = useRef<string | null>(null)
  

  // Prefetch geocodes in batches
  const geocodeItems = useCallback(async (itemsToGeocode: MapItem[]) => {
    const batchSize = 3 // Process 3 items at a time to respect rate limits
    
    for (let i = 0; i < itemsToGeocode.length; i += batchSize) {
      const batch = itemsToGeocode.slice(i, i + batchSize)
      
      const promises = batch.map(async (item) => {
        if (positions[item.id]) return
        
        const coords = await geocode(item.location)
        if (coords && isMountedRef.current) {
          setPositions(prev => ({ ...prev, [item.id]: coords }))
        }
      })

      await Promise.all(promises)
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < itemsToGeocode.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }, [positions])

  // Prefetch geocodes lazily in the background (after initial mount)
  useEffect(() => {
    isMountedRef.current = true

    // Defer geocoding slightly to avoid blocking interactions and batching state
    const id = window.setTimeout(() => {
      if (items.length > 0) {
        geocodeItems(items)
      }
    }, 250)

    return () => {
      window.clearTimeout(id)
      isMountedRef.current = false
    }
  }, [items, geocodeItems])

  // Smooth, debounced map animation when activeItemId changes
  useEffect(() => {
    if (!mapInstance) return

    // Ignore if same id as last time
    if (activeItemId && activeItemId === lastActiveIdRef.current) return

    // Clear any pending animations
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    if (!activeItemId) return

    const coords = positions[activeItemId]
    if (!coords) return

    debounceTimerRef.current = window.setTimeout(() => {
      if (!mapInstance) return
      if (isAnimating) return

      setIsAnimating(true)
      lastActiveIdRef.current = activeItemId

      // Use flyTo with short duration to reduce shaking
      mapInstance.flyTo([coords.lat, coords.lng], 15, { duration: 0.5, easeLinearity: 0.1 })

      // Open popup shortly after starting the animation
      window.setTimeout(() => {
        const marker = markersRef.current[activeItemId]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (marker && typeof (marker as any).openPopup === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (marker as any).openPopup()
        }
        setIsAnimating(false)
      }, 550)
    }, 150) // debounce hover to prevent rapid re-animating

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [activeItemId, positions, mapInstance, isAnimating])

  const markers = useMemo(() => {
    return items
      .map(item => ({ item, coords: positions[item.id] }))
      .filter(m => !!m.coords) as { item: MapItem; coords: LatLng }[]
  }, [items, positions])

  const defaultCenter: LatLng = { lat: 12.9716, lng: 77.5946 } // Bangalore

  const handleMarkerHover = useCallback((itemId: string) => {
    onItemHover?.(itemId)
  }, [onItemHover])

  const handleMarkerLeave = useCallback(() => {
    onItemHover?.(null)
  }, [onItemHover])


  return (
    <div className={`w-full h-[400px] lg:h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-gray-200 shadow-sm ${className}`}>
      <MapContainer 
        ref={(map) => {
          if (map) {
            setMapInstance(map)
          }
        }}
        center={[defaultCenter.lat, defaultCenter.lng]} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        className="map-container"
      >
        <FixMarkerIconsOnce />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map(({ item, coords }) => {
          const isActive = item.id === activeItemId
          
          return (
            <Marker 
              key={item.id} 
              position={[coords.lat, coords.lng]}
              icon={
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).createCustomIcon ? 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).createCustomIcon(isActive ? '#2563eb' : '#3b82f6', isActive) : 
                undefined
              }
              ref={(ref) => {
                if (ref) {
                  markersRef.current[item.id] = ref
                }
              }}
              eventHandlers={{
                mouseover: () => handleMarkerHover(item.id),
                mouseout: handleMarkerLeave
              }}
            >
              <Popup 
                closeButton={false} 
                offset={[0, -10]}
                className="custom-popup"
              >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[280px] max-w-[320px]">
                  <div className="flex items-start p-4 gap-3">
                    {/* Property Image */}
                    {item.imageUrl && (
                      <div className="w-16 h-16 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                          width={64}
                          height={64}
                        />
                      </div>
                    )}
                    
                    {/* Property Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {item.location}
                      </p>
                      <div className="h-px bg-gray-100 my-2" />
                      {typeof item.price === 'number' && (
                        <>
                          <div className="text-[11px] text-gray-500">Starts from :</div>
                          <div className="text-sm font-semibold text-emerald-600">
                            ₹{item.price.toLocaleString('en-IN')} <span className="text-xs font-medium text-emerald-500">/ month*</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      
      {/* Custom Styles */}
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
          background: white;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          border-radius: 12px;
          min-width: 280px;
          max-width: 320px;
          background: white;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid #f3f4f6;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .custom-marker {
          transition: all 0.2s ease;
        }
        
        .custom-marker:hover {
          transform: scale(1.1);
          z-index: 1000;
        }
        
        .map-container .leaflet-control-zoom {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .map-container .leaflet-control-zoom a {
          border-radius: 0;
          border: none;
          color: #374151;
          font-weight: 500;
        }
        
        .map-container .leaflet-control-zoom a:first-child {
          border-top-left-radius: 7px;
          border-top-right-radius: 7px;
        }
        
        .map-container .leaflet-control-zoom a:last-child {
          border-bottom-left-radius: 7px;
          border-bottom-right-radius: 7px;
        }
      `}</style>
    </div>
  )
}