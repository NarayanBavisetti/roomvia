'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/navbar'
import SearchBar from '@/components/search-bar'
import FilterBar from '@/components/filter-bar'
import FlatCard from '@/components/flat-card'
import { supabase, type Flat } from '@/lib/supabase'

// Mock data for development (replace with Supabase data when configured)
// Using fixed timestamp to prevent hydration mismatches
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
  }
]

export default function Home() {
  const [flats, setFlats] = useState<Flat[]>([])
  const [filteredFlats, setFilteredFlats] = useState<Flat[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchArea, setSearchArea] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load flats data
  useEffect(() => {
    if (!mounted) return

    const loadFlats = async () => {
      setLoading(true)
      try {
        // Try to fetch from Supabase first, fallback to mock data
        const { data, error } = await supabase
          .from('flats')
          .select('*')
          .order('created_at', { ascending: false })

        if (error || !data || data.length === 0) {
          // Use mock data if Supabase is not configured or has no data
          setFlats(mockFlats)
          setFilteredFlats(mockFlats)
        } else {
          setFlats(data)
          setFilteredFlats(data)
        }
      } catch {
        // Fallback to mock data if there's any error
        setFlats(mockFlats)
        setFilteredFlats(mockFlats)
      } finally {
        setLoading(false)
      }
    }

    loadFlats()
  }, [mounted])

  // Filter flats based on search and filters
  useEffect(() => {
    let filtered = flats

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
    if (activeFilters.price?.length) {
      filtered = filtered.filter((flat: Flat) => {
        return activeFilters.price.some((priceRange: string) => {
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

    if (activeFilters.room_type?.length) {
      filtered = filtered.filter((flat: Flat) => 
        activeFilters.room_type.includes(flat.room_type)
      )
    }

    if (activeFilters.furnishing?.length) {
      filtered = filtered.filter((flat: Flat) => 
        activeFilters.furnishing.some((furnishing: string) => 
          flat.tags.some((tag: string) => tag.toLowerCase().includes(furnishing.toLowerCase()))
        )
      )
    }

    if (activeFilters.pets?.length && activeFilters.pets.includes('true')) {
      filtered = filtered.filter((flat: Flat) => 
        flat.tags.some((tag: string) => tag.toLowerCase().includes('pet'))
      )
    }

    setFilteredFlats(filtered)
  }, [flats, searchLocation, searchArea, activeFilters])

  const handleSearch = (location: string, area: string) => {
    setSearchLocation(location)
    setSearchArea(area)
  }

  const handleFiltersChange = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
  }

  const handleFlatClick = (flat: Flat) => {
    console.log('Flat clicked:', flat.title)
    // TODO: Navigate to flat detail page
  }

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredFlats.length} {filteredFlats.length === 1 ? 'property' : 'properties'} found
                {(searchLocation || searchArea) && (
                  <span className="ml-1">
                    in {searchArea || searchLocation}
                  </span>
                )}
              </p>
            </div>

            {/* Flats grid */}
            {filteredFlats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFlats.map((flat) => (
                  <FlatCard 
                    key={flat.id} 
                    flat={flat} 
                    onClick={() => handleFlatClick(flat)}
                  />
                ))}
              </div>
            ) : (
              // No results
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">Roomvia</h2>
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