'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase, type Flat } from '@/lib/supabase'

interface UseFlatsDataOptions {
  pageSize?: number
  searchLocation?: string
  searchArea?: string
  filters?: Record<string, string[]>
}

interface UseFlatsDataReturn {
  flats: Flat[]
  loading: boolean
  hasMore: boolean
  error: string | null
  totalCount: number
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  isRefreshing: boolean
}

// Global cache for flats data to avoid unnecessary API calls
const flatsCache = new Map<string, {
  data: Flat[]
  timestamp: number
  totalCount: number
}>()

// Cache expiration time (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000

// Generate cache key based on search and filter parameters
function getCacheKey(options: UseFlatsDataOptions): string {
  const { searchLocation, searchArea, filters } = options
  return JSON.stringify({ 
    searchLocation: searchLocation || '', 
    searchArea: searchArea || '', 
    filters: filters || {} 
  })
}

// Mock data fallback (same as before but extended)
const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'
const mockFlats: Flat[] = [
  {
    id: '1',
    title: 'Modern 2BHK in Koramangala',
    location: 'Koramangala, Bangalore',
    rent: 25000,
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&h=300&fit=crop',
    room_type: '2BHK',
    tags: ['Furnished', 'Pet friendly', 'Balcony'],
    created_at: FIXED_TIMESTAMP
  },
  {
    id: '2',
    title: 'Spacious 1BHK near Metro',
    location: 'Indiranagar, Bangalore',
    rent: 18000,
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&h=300&fit=crop',
    room_type: '1BHK',
    tags: ['Semi-furnished', 'Metro nearby', 'Parking'],
    created_at: FIXED_TIMESTAMP
  },
  {
    id: '3',
    title: 'Luxury 3BHK with Pool',
    location: 'Whitefield, Bangalore',
    rent: 45000,
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=300&fit=crop',
    room_type: '3BHK',
    tags: ['Fully furnished', 'Swimming pool', 'Gym', 'Security'],
    created_at: FIXED_TIMESTAMP
  },
  {
    id: '4',
    title: 'Cozy Studio Apartment',
    location: 'HSR Layout, Bangalore',
    rent: 12000,
    image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=500&h=300&fit=crop',
    room_type: 'Studio',
    tags: ['Furnished', 'WiFi', 'Kitchen'],
    created_at: FIXED_TIMESTAMP
  },
  {
    id: '5',
    title: 'Family 2BHK with Garden',
    location: 'Electronic City, Bangalore',
    rent: 20000,
    image_url: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=500&h=300&fit=crop',
    room_type: '2BHK',
    tags: ['Semi-furnished', 'Garden', 'Pet friendly', 'Parking'],
    created_at: FIXED_TIMESTAMP
  },
  {
    id: '6',
    title: 'Modern 1BHK in IT Hub',
    location: 'Bellandur, Bangalore',
    rent: 22000,
    image_url: 'https://images.unsplash.com/photo-1571624436279-b272aff752b5?w=500&h=300&fit=crop',
    room_type: '1BHK',
    tags: ['Fully furnished', 'Tech park nearby', 'AC', 'WiFi'],
    created_at: FIXED_TIMESTAMP
  },
  // Add more mock data for pagination testing
  ...Array.from({ length: 50 }, (_, i) => ({
    id: `mock_${i + 7}`,
    title: `Property ${i + 7} in Bangalore`,
    location: `Location ${i + 7}, Bangalore`,
    rent: Math.floor(Math.random() * 50000) + 10000,
    image_url: `https://images.unsplash.com/photo-${1522708323590 + i}?w=500&h=300&fit=crop`,
    room_type: ['1BHK', '2BHK', '3BHK', 'Studio'][Math.floor(Math.random() * 4)],
    tags: ['Furnished', 'Semi-furnished', 'Parking', 'WiFi'].filter(() => Math.random() > 0.5),
    created_at: FIXED_TIMESTAMP
  }))
]

export function useFlatsData(options: UseFlatsDataOptions = {}): UseFlatsDataReturn {
  const {
    pageSize = 20,
    searchLocation = '',
    searchArea = '',
    filters = {}
  } = options

  const [flats, setFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastRequestRef = useRef<string>('')

  // Apply filters to flats data
  const applyFilters = useCallback((data: Flat[]): Flat[] => {
    let filtered = data

    // Search filtering
    if (searchLocation) {
      filtered = filtered.filter((flat: Flat) => 
        flat.location.toLowerCase().includes(searchLocation.toLowerCase())
      )
    }

    if (searchArea) {
      filtered = filtered.filter((flat: Flat) => 
        flat.location.toLowerCase().includes(searchArea.toLowerCase()) ||
        flat.title.toLowerCase().includes(searchArea.toLowerCase())
      )
    }

    // Apply filters
    if (filters.price?.length) {
      filtered = filtered.filter((flat: Flat) => {
        return filters.price.some((priceRange: string) => {
          switch (priceRange) {
            case '< ₹15k': return flat.rent < 15000
            case '₹15k-25k': return flat.rent >= 15000 && flat.rent <= 25000
            case '₹25k-40k': return flat.rent >= 25000 && flat.rent <= 40000
            case '> ₹40k': return flat.rent > 40000
            default: return true
          }
        })
      })
    }

    if (filters.room_type?.length) {
      filtered = filtered.filter((flat: Flat) => 
        filters.room_type.includes(flat.room_type)
      )
    }

    if (filters.furnishing?.length) {
      filtered = filtered.filter((flat: Flat) => 
        filters.furnishing.some((furnishing: string) => 
          flat.tags.some((tag: string) => tag.toLowerCase().includes(furnishing.toLowerCase()))
        )
      )
    }

    if (filters.pets?.length && filters.pets.includes('true')) {
      filtered = filtered.filter((flat: Flat) => 
        flat.tags.some((tag: string) => tag.toLowerCase().includes('pet'))
      )
    }

    return filtered
  }, [searchLocation, searchArea, filters])

  // Fetch data from API or cache
  const fetchFlats = useCallback(async (page: number = 0, reset: boolean = false): Promise<void> => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const requestId = `${Date.now()}_${page}`
    lastRequestRef.current = requestId

    try {
      if (reset || page === 0) {
        setLoading(true)
      }
      setError(null)

      // Check cache first
      const cacheKey = getCacheKey({ searchLocation, searchArea, filters })
      const cached = flatsCache.get(cacheKey)
      const now = Date.now()

      if (cached && (now - cached.timestamp) < CACHE_EXPIRATION && page === 0) {
        // Use cached data for first page
        const filteredData = applyFilters(cached.data)
        const paginatedData = filteredData.slice(0, pageSize)
        
        setFlats(paginatedData)
        setTotalCount(filteredData.length)
        setHasMore(filteredData.length > pageSize)
        setCurrentPage(0)
        setLoading(false)
        return
      }

      // Check if this request is still the latest
      if (signal.aborted || lastRequestRef.current !== requestId) {
        return
      }

      let allData: Flat[] = []
      let count = 0

      try {
        // Try to fetch from Supabase
        const { data: supabaseData, error: supabaseError, count: supabaseCount } = await supabase
          .from('flats')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .abortSignal(signal)

        if (signal.aborted || lastRequestRef.current !== requestId) {
          return
        }

        if (supabaseError || !supabaseData || supabaseData.length === 0) {
          throw new Error('Supabase data not available')
        }

        allData = supabaseData
        count = supabaseCount || supabaseData.length
      } catch {
        // Fallback to mock data
        allData = mockFlats
        count = mockFlats.length
      }

      // Cache the raw data
      flatsCache.set(cacheKey, {
        data: allData,
        timestamp: now,
        totalCount: count
      })

      // Apply filters
      const filteredData = applyFilters(allData)
      
      // Calculate pagination
      const startIndex = page * pageSize
      const endIndex = startIndex + pageSize
      const paginatedData = filteredData.slice(0, endIndex)

      // Check if this request is still the latest
      if (signal.aborted || lastRequestRef.current !== requestId) {
        return
      }

      if (reset || page === 0) {
        setFlats(paginatedData)
      } else {
        setFlats(prev => [...prev, ...filteredData.slice(startIndex, endIndex)])
      }

      setTotalCount(filteredData.length)
      setHasMore(endIndex < filteredData.length)
      setCurrentPage(page)

    } catch (err) {
      if (signal.aborted || lastRequestRef.current !== requestId) {
        return
      }

      console.error('Error fetching flats:', err)
      setError('Failed to load properties. Please try again.')
      
      // Fallback to mock data on error
      const filteredData = applyFilters(mockFlats)
      const paginatedData = filteredData.slice(0, pageSize)
      
      if (reset || page === 0) {
        setFlats(paginatedData)
      }
      
      setTotalCount(filteredData.length)
      setHasMore(filteredData.length > pageSize)
      setCurrentPage(0)
    } finally {
      if (lastRequestRef.current === requestId) {
        setLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [pageSize, searchLocation, searchArea, filters, applyFilters])

  // Load more data (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || loading) return
    await fetchFlats(currentPage + 1, false)
  }, [hasMore, loading, currentPage, fetchFlats])

  // Refresh data
  const refresh = useCallback(async (): Promise<void> => {
    setIsRefreshing(true)
    
    // Clear cache for current parameters
    const cacheKey = getCacheKey({ searchLocation, searchArea, filters })
    flatsCache.delete(cacheKey)
    
    await fetchFlats(0, true)
  }, [fetchFlats, searchLocation, searchArea, filters])

  // Initial load and when dependencies change
  useEffect(() => {
    fetchFlats(0, true)
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchFlats])

  // Memoized return value
  const returnValue = useMemo(() => ({
    flats,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore,
    refresh,
    isRefreshing
  }), [flats, loading, hasMore, error, totalCount, loadMore, refresh, isRefreshing])

  return returnValue
}