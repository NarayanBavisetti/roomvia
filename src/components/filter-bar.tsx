'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X, Filter } from 'lucide-react'

interface Filter {
  id: string
  label: string
  options?: string[]
  type: 'toggle' | 'select' | 'range'
}

const filters: Filter[] = [
  {
    id: 'price',
    label: 'Price',
    type: 'select',
    options: ['< ₹15k', '₹15k-25k', '₹25k-40k', '> ₹40k']
  },
  {
    id: 'furnishing',
    label: 'Furnishing',
    type: 'select',
    options: ['Furnished', 'Semi-furnished', 'Unfurnished']
  },
  {
    id: 'room_type',
    label: 'Room Type',
    type: 'select',
    options: ['1BHK', '2BHK', '3BHK', 'Studio']
  },
  {
    id: 'amenities',
    label: 'Amenities',
    type: 'select',
    options: ['WiFi', 'AC', 'Parking', 'Gym', 'Swimming Pool']
  },
  {
    id: 'metro',
    label: 'Metro Distance',
    type: 'select',
    options: ['< 0.5km', '0.5-1km', '1-2km', '> 2km']
  },
  {
    id: 'pets',
    label: 'Pets',
    type: 'toggle'
  }
]

interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void
}

export default function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFilter = (filterId: string, value?: string) => {
    if (filters.find(f => f.id === filterId)?.type === 'toggle') {
      const newFilters = { ...activeFilters }
      if (newFilters[filterId]?.length) {
        delete newFilters[filterId]
      } else {
        newFilters[filterId] = ['true']
      }
      setActiveFilters(newFilters)
      onFiltersChange?.(newFilters)
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
      onFiltersChange?.(newFilters)
    }
    setOpenDropdown(null)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    onFiltersChange?.({})
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((acc, filters) => acc + filters.length, 0)
  }

  return (
    <div className={`transition-all duration-300 ${
      isSticky ? 'fixed top-16 left-0 right-0 z-40' : 'relative'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="p-2 bg-purple-50 rounded-full">
                <Filter className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm font-semibold">Filters</span>
            </div>

            {/* Filter buttons - scrollable on mobile */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex items-center gap-3 min-w-max">
              {filters.map((filter) => (
                <div key={filter.id} className="relative">
                    <Button
                      variant={activeFilters[filter.id]?.length ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => filter.type === 'toggle' 
                        ? toggleFilter(filter.id) 
                        : setOpenDropdown(openDropdown === filter.id ? null : filter.id)
                      }
                      className={`group rounded-full whitespace-nowrap transition-all duration-300 hover:scale-105 transform ${
                        activeFilters[filter.id]?.length 
                          ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-md' 
                          : 'border-gray-300 hover:border-purple-400 hover:text-purple-600 hover:shadow-sm'
                      }`}
                    >
                    {filter.label}
                      {activeFilters[filter.id]?.length && (
                        <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-white/20 text-white border-0">
                          {activeFilters[filter.id].length}
                        </Badge>
                      )}
                      {filter.type !== 'toggle' && (
                        <ChevronDown className={`ml-1 h-3 w-3 transition-transform duration-200 ${
                          openDropdown === filter.id ? 'rotate-180' : ''
                        }`} />
                      )}
                  </Button>

                    {/* Dropdown menu */}
                    {openDropdown === filter.id && filter.options && (
                      <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-48">
                        <div className="p-2">
                        {filter.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => toggleFilter(filter.id, option)}
                              className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 transform ${
                                activeFilters[filter.id]?.includes(option)
                                  ? 'bg-purple-50 text-purple-700 shadow-sm' 
                                  : 'hover:bg-gray-50 hover:text-purple-600'
                              }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clear filters button */}
            {getActiveFilterCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="group rounded-full text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:scale-105 transform"
              >
                <X className="h-4 w-4 mr-1 group-hover:rotate-90 transition-transform duration-300" />
                Clear all
              </Button>
            )}
        </div>

          {/* Active filters display */}
          {getActiveFilterCount() > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([filterId, values]) => 
              values.map((value) => (
                  <Badge
                    key={`${filterId}-${value}`}
                    variant="secondary"
                    className="group bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 hover:from-purple-200 hover:to-purple-100 transition-all duration-200 hover:scale-105 transform border-purple-200"
                  >
                  {filters.find(f => f.id === filterId)?.label}: {value === 'true' ? 'Allowed' : value}
                    <button
                      onClick={() => toggleFilter(filterId, value)}
                      className="ml-1 hover:bg-purple-300 rounded-full p-0.5 transition-all duration-200 hover:scale-110 transform"
                    >
                      <X className="h-3 w-3" />
                    </button>
                </Badge>
              ))
            )}
          </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}