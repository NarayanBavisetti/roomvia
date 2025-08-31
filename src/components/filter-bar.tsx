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
    <div className={`bg-white border-b border-gray-200 transition-all duration-300 ${
      isSticky ? 'fixed top-16 left-0 right-0 z-40 shadow-sm' : 'relative'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
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
                    className={`rounded-full whitespace-nowrap transition-colors ${
                      activeFilters[filter.id]?.length 
                        ? 'bg-purple-50 text-purple-700 hover:bg-purple-100' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {filter.label}
                    {activeFilters[filter.id]?.length && (
                      <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs bg-white text-purple-600">
                        {activeFilters[filter.id].length}
                      </Badge>
                    )}
                    {filter.type !== 'toggle' && (
                      <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>

                  {/* Dropdown menu */}
                  {openDropdown === filter.id && filter.options && (
                    <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
                      <div className="p-2">
                        {filter.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => toggleFilter(filter.id, option)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              activeFilters[filter.id]?.includes(option)
                                ? 'bg-purple-50 text-purple-700' 
                                : 'hover:bg-gray-50'
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
              className="rounded-full text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Active filters display */}
        {getActiveFilterCount() > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([filterId, values]) => 
              values.map((value) => (
                <Badge
                  key={`${filterId}-${value}`}
                  variant="secondary"
                  className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                >
                  {filters.find(f => f.id === filterId)?.label}: {value === 'true' ? 'Allowed' : value}
                  <button
                    onClick={() => toggleFilter(filterId, value)}
                    className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        )}
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