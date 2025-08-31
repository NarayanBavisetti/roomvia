'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '@/components/navbar'
import SearchBar from '@/components/search-bar'
import FilterBar from '@/components/filter-bar'
import FlatCard from '@/components/flat-card'
import FlatCardSkeleton from '@/components/flat-card-skeleton'
import EnhancedMapView from '@/components/enhanced-map-view'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, MapPin, Search, X } from 'lucide-react'
import { useFlatsData } from '@/hooks/useFlatsData'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import type { Flat } from '@/lib/supabase'

// Mock data for development (replace with Supabase data when configured) 
// Using fixed timestamp to prevent hydration mismatches
// const FIXED_TIMESTAMP = '2024-01-01T00:00:00.000Z'

// Note: Mock data is now handled in the useFlatsData hook
/* const mockFlats: Flat[] = [
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
  }
] */

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchArea, setSearchArea] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mapSearchQuery, setMapSearchQuery] = useState('')

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use the enhanced data fetching hook
  const {
    flats,
    loading,
    hasMore,
    error,
    totalCount,
    loadMore,
    refresh,
    isRefreshing
  } = useFlatsData({
    pageSize: 20,
    searchLocation,
    searchArea,
    filters: activeFilters
  })

  // Infinite scroll
  const { setElement } = useInfiniteScroll({
    loading,
    hasMore,
    onLoadMore: loadMore,
    threshold: 0.1,
    rootMargin: '100px'
  })

  // Convert flats to map items
  const mapItems = useMemo(() => {
    return flats.map(flat => ({
      id: flat.id,
      title: flat.title,
      location: flat.location,
      imageUrl: flat.image_url,
      price: flat.rent,
      roomType: flat.room_type,
      tags: flat.tags
    }))
  }, [flats])

  const handleSearch = (location: string, area: string) => {
    setSearchLocation(location)
    setSearchArea(area)
  }

  const handleFiltersChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
  }

  const handleFlatClick = useCallback((flat: Flat) => {
    console.log('Flat clicked:', flat.title)
    // TODO: Navigate to flat detail page
  }, [])

  const handleMapItemHover = useCallback((itemId: string | null) => {
    setHoveredId(itemId)
  }, [])

  const handleRefresh = useCallback(async () => {
    try {
      await refresh()
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }, [refresh])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white">
        <SearchBar onSearch={handleSearch} />
      </section>

      {/* Filter Bar */}
      <FilterBar onFiltersChange={handleFiltersChange} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Results count and refresh button */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <p className="text-lg font-medium text-gray-900">
              {loading && flats.length === 0 ? (
                'Loading properties...'
              ) : (
                <>
                  {totalCount} {totalCount === 1 ? 'property' : 'properties'} found
                  {(searchLocation || searchArea) && (
                    <span className="ml-1 text-gray-600 font-normal">
                      in {searchArea || searchLocation}
                    </span>
                  )}
                </>
              )}
            </p>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2 border-gray-300 hover:border-gray-400 self-start sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Cards + Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2">
            {flats.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                  {flats.map((flat, index) => (
                    <div
                      key={flat.id}
                      onMouseEnter={() => setHoveredId(flat.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{ 
                        animationDelay: `${Math.min(index * 50, 500)}ms` 
                      }}
                      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      <FlatCard 
                        flat={flat} 
                        onClick={() => handleFlatClick(flat)}
                      />
                    </div>
                  ))}
                </div>
                
                {/* Loading more cards */}
                {(loading && flats.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 mt-8">
                    {[...Array(4)].map((_, i) => (
                      <FlatCardSkeleton key={`skeleton-${i}`} />
                    ))}
                  </div>
                )}
                
                {/* Infinite scroll trigger */}
                <div ref={setElement} className="h-4 mt-12" />
                
                {/* Load more button as fallback */}
                {hasMore && !loading && (
                  <div className="text-center mt-12">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      className="px-8 py-3 border-gray-300 hover:border-gray-400 rounded-xl"
                    >
                      Load More Properties
                    </Button>
                  </div>
                )}
                
                {/* End of results */}
                {!hasMore && flats.length > 0 && (
                  <div className="text-center mt-12 py-6 text-gray-500 text-sm">
                    You&apos;ve reached the end of the results
                  </div>
                )}
              </>
            ) : loading && flats.length === 0 ? (
              // Initial loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                {[...Array(8)].map((_, i) => (
                  <FlatCardSkeleton key={`initial-skeleton-${i}`} />
                ))}
              </div>
            ) : (
              // No results
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No properties found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
                <Button onClick={handleRefresh} variant="outline" className="border-gray-300 hover:border-gray-400 rounded-xl px-6 py-3">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Results
                </Button>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-28">
              {/* Map Search Box - Above the map */}
              <div className="mb-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex items-center h-12 px-4 gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search location or enter address"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    className="flex-1 text-sm text-gray-900 placeholder-gray-500 border-none outline-none bg-transparent"
                  />
                  {mapSearchQuery && (
                    <button
                      onClick={() => setMapSearchQuery('')}
                      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
              
              <EnhancedMapView
                items={mapItems}
                activeItemId={hoveredId}
                onItemHover={handleMapItemHover}
                searchQuery={mapSearchQuery}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-500 mb-4">Roomvia</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Find your perfect room or flatmate with ease. Connect with verified landlords and tenants across India.
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900 transition-colors">About</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-400 text-sm">
                © 2024 Roomvia. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}