'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Navbar from '@/components/navbar'
import FlatmateCard from '@/components/flatmate-card'
import { supabase, type Flatmate } from '@/lib/supabase'
import { Users, ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import * as Popover from '@radix-ui/react-popover'
import { INDIAN_STATES, INDIAN_CITIES } from '@/lib/location-data'

// Filter configuration for flatmates
interface FilterOption {
  id: string
  label: string
  options?: string[]
  type: 'toggle' | 'select' | 'range'
  hasCustomDropdown?: boolean
}

const STATE_OPTIONS = INDIAN_STATES.map(s => s.name)
const CITY_OPTIONS = INDIAN_CITIES.map(c => c.name)

const mainFilters: FilterOption[] = [
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female']
  },
  {
    id: 'budget',
    label: 'Budget',
    type: 'range',
    hasCustomDropdown: true
  },
  {
    id: 'food_preference',
    label: 'Food Preference',
    type: 'select',
    options: ['Veg', 'Non-Veg']
  },
  {
    id: 'state',
    label: 'State',
    type: 'select',
    options: STATE_OPTIONS
  },
  {
    id: 'city',
    label: 'City',
    type: 'select',
    options: CITY_OPTIONS
  },
  {
    id: 'area',
    label: 'Area',
    type: 'select',
    options: []
  },
  {
    id: 'company',
    label: 'Company',
    type: 'select',
    options: ['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple', 'Qualcomm', 'Other']
  }
]

const moreFilters = {
  lifestyle: {
    label: 'Lifestyle Preferences',
    options: [
      { id: 'non_smoker', label: 'Non-Smoker' },
      { id: 'smoker', label: 'Smoker' }
    ]
  },
  property_type: {
    label: 'Property Preference',
    options: [
      { id: 'gated_community', label: 'Gated Community' },
      { id: 'independent', label: 'Independent House' },
      { id: 'apartment', label: 'Apartment' }
    ]
  },
  location: {
    label: 'Preferred Locations',
    options: [
      { id: 'gachibowli', label: 'Gachibowli' },
      { id: 'hitec_city', label: 'Hitec City' },
      { id: 'kondapur', label: 'Kondapur' },
      { id: 'madhapur', label: 'Madhapur' },
      { id: 'banjara_hills', label: 'Banjara Hills' }
    ]
  }
}

export default function FlatmatesPage() {
  const [flatmates, setFlatmates] = useState<Flatmate[]>([])
  const [filteredFlatmates, setFilteredFlatmates] = useState<Flatmate[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [budgetRange, setBudgetRange] = useState<[number, number]>([10000, 50000])
  const [, setError] = useState<string | null>(null)

  // Derived city options based on selected state(s)
  const selectedStates = activeFilters['state'] || []
  const selectedCities = activeFilters['city'] || []
  const cityOptionsForSelectedStates = selectedStates.length === 0
    ? CITY_OPTIONS
    : Array.from(new Set(
        INDIAN_CITIES
          .filter(c => {
            const stateName = INDIAN_STATES.find(s => s.id === c.stateId)?.name || ''
            return selectedStates.includes(stateName)
          })
          .map(c => c.name)
      )).sort((a, b) => a.localeCompare(b))

  // Dynamic area options from preferred_locations, narrowed by selected city/state
  const areaOptionsForSelection = useMemo(() => {
    let pool = flatmates
    if (selectedStates.length) {
      pool = pool.filter(f => selectedStates.includes(f.state || ''))
    }
    if (selectedCities.length) {
      pool = pool.filter(f => selectedCities.includes(f.city || ''))
    }
    const areaSet = new Set<string>()
    pool.forEach(f => {
      (f.preferred_locations || []).forEach(loc => {
        if (loc && typeof loc === 'string') areaSet.add(loc)
      })
    })
    return Array.from(areaSet).sort((a, b) => a.localeCompare(b))
  }, [flatmates, selectedStates, selectedCities])

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

    // Apply active filters
    Object.entries(activeFilters).forEach(([filterId, values]) => {
      if (values.length === 0) return

      switch (filterId) {
        case 'gender':
          filtered = filtered.filter((flatmate: Flatmate) => 
            values.includes(flatmate.gender)
          )
          break
        case 'food_preference':
          filtered = filtered.filter((flatmate: Flatmate) => 
            values.includes(flatmate.food_preference)
          )
          break
        case 'company':
          filtered = filtered.filter((flatmate: Flatmate) => 
            values.includes(flatmate.company)
          )
          break
        case 'state':
          filtered = filtered.filter((flatmate: Flatmate) => 
            values.includes(flatmate.state || '')
          )
          break
        case 'city':
          filtered = filtered.filter((flatmate: Flatmate) => 
            values.includes(flatmate.city || '')
          )
          break
        case 'area':
          filtered = filtered.filter((flatmate: Flatmate) => {
            const areas = (flatmate.preferred_locations || []).map(l => l.toLowerCase())
            return values.some(v => areas.includes(v.toLowerCase()))
          })
          break
        case 'lifestyle':
          filtered = filtered.filter((flatmate: Flatmate) => {
            if (values.includes('non_smoker')) return flatmate.non_smoker
            if (values.includes('smoker')) return !flatmate.non_smoker
            return true
          })
          break
        case 'property_type':
          filtered = filtered.filter((flatmate: Flatmate) => {
            if (values.includes('gated_community')) return flatmate.gated_community
            return true
          })
          break
        case 'location': {
          const selectedLabels = values
            .map(v => moreFilters.location.options.find(o => o.id === v)?.label?.toLowerCase())
            .filter(Boolean) as string[]
          filtered = filtered.filter((flatmate: Flatmate) => 
            flatmate.preferred_locations.some(loc => selectedLabels.includes(loc.toLowerCase()))
          )
          break
        }
      }
    })

    // Budget filtering
    filtered = filtered.filter((flatmate: Flatmate) => 
      flatmate.budget_min <= budgetRange[1] && flatmate.budget_max >= budgetRange[0]
    )

    setFilteredFlatmates(filtered)
  }, [flatmates, searchQuery, activeFilters, budgetRange])

  const handleConnect = (flatmate: Flatmate) => {
    console.log('Connect with:', flatmate.name)
    // TODO: Implement connect functionality
  }

  // Filter management functions
  const toggleFilter = useCallback((filterId: string, value?: string) => {
    if (mainFilters.find(f => f.id === filterId)?.type === 'toggle') {
      const newFilters = { ...activeFilters }
      if (newFilters[filterId]?.length) {
        delete newFilters[filterId]
      } else {
        newFilters[filterId] = ['true']
      }
      setActiveFilters(newFilters)
    } else if (value) {
      const newFilters = { ...activeFilters }
      if (!newFilters[filterId]) {
        newFilters[filterId] = []
      }
      
      if (newFilters[filterId].includes(value)) {
        newFilters[filterId] = newFilters[filterId].filter(v => v !== value)
        if (newFilters[filterId].length === 0) {
          delete newFilters[filterId]
        }
      } else {
        newFilters[filterId] = [...newFilters[filterId], value]
      }
      
      setActiveFilters(newFilters)
    }
  }, [activeFilters])

  const toggleMoreFilter = useCallback((category: string, value: string) => {
    const newFilters = { ...activeFilters }
    if (!newFilters[category]) {
      newFilters[category] = []
    }
    
    if (newFilters[category].includes(value)) {
      newFilters[category] = newFilters[category].filter(v => v !== value)
      if (newFilters[category].length === 0) {
        delete newFilters[category]
      }
    } else {
      // Allow multiple selections for locations; single-select for others
      const isLocation = category === 'location'
      newFilters[category] = isLocation ? [...newFilters[category], value] : [value]
    }
    
    setActiveFilters(newFilters)
  }, [activeFilters])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
    setBudgetRange([10000, 50000])
    setSearchQuery('')
  }, [])

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((acc, filters) => acc + filters.length, 0)
  }

  // Budget range slider component
  const BudgetRangeSlider = () => {
    const [localRange, setLocalRange] = useState(budgetRange)

    useEffect(() => {
      setLocalRange(budgetRange)
    }, [budgetRange])

    const handleRangeChange = (newRange: [number, number]) => {
      setLocalRange(newRange)
      setBudgetRange(newRange)
    }

    return (
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">min budget</label>
            <input
              type="text"
              value={`₹ ${localRange[0].toLocaleString()}`}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 10000
                const newMin = Math.max(10000, Math.min(value, localRange[1] - 1000))
                handleRangeChange([newMin, localRange[1]])
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="text-gray-400 pt-6">—</div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">max budget</label>
            <input
              type="text"
              value={`₹ ${localRange[1].toLocaleString()}`}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 50000
                const newMax = Math.min(100000, Math.max(value, localRange[0] + 1000))
                handleRangeChange([localRange[0], newMax])
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>
    )
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-white-50" suppressHydrationWarning>
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

          {/* Enhanced Filter Bar */}
          <div className="max-w-6xl mx-auto">
            {/* Filter Options */}
            <div className="w-full sticky top-0 z-10">
              <div 
                className="w-full transition-all duration-200 ease-out relative z-10"
                style={{
                  pointerEvents: 'auto'
                }}
              >
                <div 
                  className="max-w-7xl mx-auto sm:px-6 lg:px-8 transition-all duration-300 ease-out bg-white border-b border-gray-100/20 py-4"
                  style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}
                >
                  <div style={{ overflow: 'visible' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        {mainFilters.map((filter) => (
                          <Popover.Root key={filter.id}>
                            <Popover.Trigger asChild>
                              <button
                                className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-full transition-all duration-200 font-medium ${
                                  activeFilters[filter.id]?.length 
                                    ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                                }`}
                              >
                                {filter.label}
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </Popover.Trigger>

                            <Popover.Portal>
                              <Popover.Content
                                className="z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-visible"
                                style={{ 
                                  minWidth: filter.id === 'budget' ? '320px' : '280px',
                                  maxHeight: '400px',
                                  overflowY: 'auto',
                                }}
                                sideOffset={8}
                                align="start"
                              >
                                {filter.hasCustomDropdown && filter.id === 'budget' ? (
                                  <BudgetRangeSlider />
                                ) : (
                                  <div className="px-5 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      {(filter.id === 'city' 
                                        ? cityOptionsForSelectedStates 
                                        : filter.id === 'area'
                                          ? areaOptionsForSelection
                                          : filter.options
                                      )?.map((option) => (
                                        <button
                                          key={option}
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            toggleFilter(filter.id, option)
                                          }}
                                          className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap ${
                                            activeFilters[filter.id]?.includes(option)
                                              ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                                          }`}
                                        >
                                          {option}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </Popover.Content>
                            </Popover.Portal>
                          </Popover.Root>
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        <Popover.Root>
                          <Popover.Trigger asChild>
                            <button
                              className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-full transition-all duration-200 font-medium ${
                                Object.keys(activeFilters).some(key => !mainFilters.find(f => f.id === key))
                                  ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                              More Filters
                              {Object.keys(activeFilters).some(key => !mainFilters.find(f => f.id === key)) && (
                                <span className="ml-1 bg-white text-purple-500 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                                  {Object.entries(activeFilters).filter(([key]) => !mainFilters.find(f => f.id === key)).reduce((acc, [, values]) => acc + values.length, 0)}
                                </span>
                              )}
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </Popover.Trigger>

                          <Popover.Portal>
                            <Popover.Content 
                              className="z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-[480px]"
                              style={{
                                maxHeight: '520px'
                              }}
                              sideOffset={8}
                              align="end"
                            >
                              <div style={{ maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }} className="px-5 py-4 space-y-6">
                                {Object.entries(moreFilters).map(([categoryKey, category]) => (
                                  <div key={categoryKey} className="space-y-3">
                                    <h4 className="text-base font-semibold text-gray-900">{category.label}</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {category.options.map((option) => {
                                        const isSelected = activeFilters[categoryKey]?.includes(option.id) || false
                                        return (
                                          <button
                                            key={option.id}
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              toggleMoreFilter(categoryKey, option.id)
                                            }}
                                            className={`px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border whitespace-nowrap ${
                                              isSelected
                                                ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                                            }`}
                                          >
                                            {option.label}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>

                        {getActiveFilterCount() > 0 && (
                          <button
                            onClick={clearAllFilters}
                            className="text-sm text-gray-500 hover:text-red-600 underline transition-colors"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Active filter chips */}
                    {getActiveFilterCount() > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {Object.entries(activeFilters).map(([filterId, values]) => 
                          values.map((value) => {
                            const filter = mainFilters.find(f => f.id === filterId)
                            const moreFilter = Object.entries(moreFilters).find(([key]) => key === filterId)?.[1]
                            const filterName = filter?.label || moreFilter?.label || filterId
                            const optionLabel = moreFilter?.options.find(opt => opt.id === value)?.label || value
                            
                            return (
                              <Badge
                                key={`${filterId}-${value}`}
                                variant="secondary"
                                className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                              >
                                <span className="text-xs text-gray-500 mr-1">{filterName}:</span>
                                {optionLabel === 'true' ? 'Enabled' : optionLabel}
                                <button
                                  onClick={() => {
                                    if (filter) {
                                      toggleFilter(filterId, value)
                                    } else {
                                      toggleMoreFilter(filterId, value)
                                    }
                                  }}
                                  className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <p className="text-lg font-medium text-gray-900">
              {loading && filteredFlatmates.length === 0 ? (
                'Loading profiles...'
              ) : (
                <>
                  <span className="text-xl font-bold text-purple-600">{filteredFlatmates.length}</span>{' '}
                  {filteredFlatmates.length === 1 ? 'profile' : 'profiles'} found
                  {getActiveFilterCount() > 0 && (
                    <span className="ml-1 text-gray-600 font-normal">
                      with selected filters
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
        
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                <div className="p-6">
                  <div className="w-20 h-20 bg-white-200 rounded-full mx-auto mb-4" />
                  <div className="space-y-3 text-center">
                    <div className="h-5 bg-white-200 rounded w-3/4 mx-auto" />
                    <div className="h-4 bg-white-200 rounded w-1/2 mx-auto" />
                    <div className="h-6 bg-white-200 rounded w-2/3 mx-auto" />
                    <div className="h-8 bg-white-200 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
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
                  onClick={clearAllFilters}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </main>


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