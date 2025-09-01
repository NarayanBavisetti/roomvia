'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/navbar'
import FlatmateCard from '@/components/flatmate-card'
import { supabase, type Flatmate } from '@/lib/supabase'
import { Users, Search, Filter, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// All flatmate data now comes from the database

export default function FlatlatesPage() {
  const [flatmates, setFlatmates] = useState<Flatmate[]>([])
  const [filteredFlatmates, setFilteredFlatmates] = useState<Flatmate[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load flatmates data
  useEffect(() => {
    if (!mounted) return

    const loadFlatmates = async () => {
      setLoading(true)
      try {
        // Fetch from Supabase database
        const { data, error } = await supabase
          .from('flatmates')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          throw new Error(`Database error: ${error.message}`)
        }

        // Use real data from database (empty array if no data)
        setFlatmates(data || [])
        setFilteredFlatmates(data || [])
      } catch (err) {
        console.error('Error loading flatmates:', err)
        setError('Failed to load flatmates. Please try again.')
        // Show empty state instead of mock data
        setFlatmates([])
        setFilteredFlatmates([])
      } finally {
        setLoading(false)
      }
    }

    loadFlatmates()
  }, [mounted])

  // Filter flatmates based on search and filters
  useEffect(() => {
    let filtered = flatmates

    // Search filtering
    if (searchQuery) {
      filtered = filtered.filter((flatmate: Flatmate) => 
        flatmate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flatmate.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flatmate.preferred_locations.some(location => 
          location.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // Category filtering
    if (selectedFilter !== 'all') {
      switch (selectedFilter) {
        case 'male':
          filtered = filtered.filter((flatmate: Flatmate) => flatmate.gender === 'Male')
          break
        case 'female':
          filtered = filtered.filter((flatmate: Flatmate) => flatmate.gender === 'Female')
          break
        case 'non-smoker':
          filtered = filtered.filter((flatmate: Flatmate) => flatmate.non_smoker)
          break
        case 'veg':
          filtered = filtered.filter((flatmate: Flatmate) => flatmate.food_preference === 'Veg')
          break
        case 'gated':
          filtered = filtered.filter((flatmate: Flatmate) => flatmate.gated_community)
          break
      }
    }

    setFilteredFlatmates(filtered)
  }, [flatmates, searchQuery, selectedFilter])

  const handleConnect = (flatmate: Flatmate) => {
    console.log('Connect with:', flatmate.name)
    // TODO: Implement connect functionality
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find your perfect <span className="text-purple-500">flatmate</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with verified professionals looking for shared accommodation
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="max-w-4xl mx-auto">
            {/* Search Input */}
            <div className="mb-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search by name, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-lg border-gray-200 focus:border-purple-500 rounded-xl bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="bg-gray-50 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center justify-center mb-4">
                <Filter className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filter by preferences</span>
              </div>
              
              {/* Desktop: 2 rows, Mobile: 3 rows */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'all', label: 'All Profiles', shortLabel: 'All', icon: <Users className="h-4 w-4" /> },
                  { key: 'male', label: 'Male', shortLabel: 'Male', icon: <Users className="h-4 w-4" /> },
                  { key: 'female', label: 'Female', shortLabel: 'Female', icon: <Users className="h-4 w-4" /> },
                  { key: 'non-smoker', label: 'Non-smoker', shortLabel: 'Non-smoker', icon: <Heart className="h-4 w-4" /> },
                  { key: 'veg', label: 'Vegetarian', shortLabel: 'Vegetarian', icon: <Filter className="h-4 w-4" /> },
                  { key: 'gated', label: 'Gated Community', shortLabel: 'Gated', icon: <Filter className="h-4 w-4" /> }
                ].map((filter) => (
                  <Button
                    key={filter.key}
                    variant={selectedFilter === filter.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter.key)}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${
                      selectedFilter === filter.key 
                        ? 'bg-purple-500 text-white hover:bg-purple-800 shadow-md transform scale-105' 
                        : 'bg-white hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 border-gray-200'
                    }`}
                  >
                    {filter.icon}
                    <span className="hidden sm:inline">{filter.label}</span>
                    <span className="sm:hidden">{filter.shortLabel}</span>
                  </Button>
                ))}
              </div>
              
              {/* Active filter indicator */}
              {selectedFilter !== 'all' && (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Showing: {[
                      { key: 'male', label: 'Male profiles' },
                      { key: 'female', label: 'Female profiles' },
                      { key: 'non-smoker', label: 'Non-smoker profiles' },
                      { key: 'veg', label: 'Vegetarian profiles' },
                      { key: 'gated', label: 'Gated community preferences' }
                    ].find(f => f.key === selectedFilter)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="p-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4" />
                  <div className="space-y-3 text-center">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                    <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-8">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-gray-700 font-medium text-center">
                  <span className="text-purple-500 font-bold text-lg">{filteredFlatmates.length}</span>
                  {' '}{filteredFlatmates.length === 1 ? 'profile' : 'profiles'} found
                  {searchQuery && (
                    <span className="ml-1 text-gray-600">
                      for &quot;<span className="font-semibold text-gray-800">{searchQuery}</span>&quot;
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Flatmates grid */}
            {filteredFlatmates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {filteredFlatmates.map((flatmate, index) => (
                  <div
                    key={flatmate.id}
                    className="animate-fadeIn"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <FlatmateCard 
                      flatmate={flatmate} 
                      onConnect={() => handleConnect(flatmate)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // No results
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No profiles found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* CTA Section */}
      <section className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Looking for a flatmate?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Create your profile and let others discover you. It&apos;s free and takes less than 5 minutes.
            </p>
            <Button className="bg-purple-500 hover:bg-purple-800 text-white px-8 py-3 rounded-xl font-semibold">
              Create Your Profile
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
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