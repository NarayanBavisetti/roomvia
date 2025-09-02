'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X, SlidersHorizontal, Home, Building2 } from 'lucide-react'

interface FilterOption {
  id: string
  label: string
  options?: string[]
  type: 'toggle' | 'select' | 'range'
  hasCustomDropdown?: boolean
}

const filters: FilterOption[] = [
  {
    id: 'locality',
    label: 'Locality',
    type: 'select',
    options: ['Gachibowli', 'Hitec City', 'Kondapur', 'Kukatpally', 'Madhapur', 'Banjara Hills']
  },
  {
    id: 'budget',
    label: 'Budget',
    type: 'range',
    hasCustomDropdown: true
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Unisex']
  },
  {
    id: 'preferred_by',
    label: 'Preferred By',
    type: 'select',
    options: ['Working Professionals', 'Students', 'Family', 'Anyone']
  }
]

const sortOptions = [
  'Distance',
  'Price: Low to High',
  'Price: High to Low',
  'Newest First',
  'Most Popular'
]

interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void
}

export default function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [isSticky, setIsSticky] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [barHeight, setBarHeight] = useState(0)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([6899, 28699])
  const [activeTab, setActiveTab] = useState<'pg_hostels' | 'flats'>('pg_hostels')
  const [selectedSort, setSelectedSort] = useState('Distance')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const originalPosition = useRef<number>(0)

  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect()
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            
            // If not sticky, record the original position
            if (!isSticky) {
              originalPosition.current = scrollTop + rect.top
            }
            
            // Determine if should be sticky based on original position
            const shouldBeSticky = scrollTop >= originalPosition.current
            
            if (shouldBeSticky !== isSticky) {
              setIsSticky(shouldBeSticky)
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('filters-sticky-change', { detail: { sticky: shouldBeSticky } }))
              }
            }
          }
          ticking = false
        })
        ticking = true
      }
    }

    // Initial position calculation
    if (containerRef.current && originalPosition.current === 0) {
      const rect = containerRef.current.getBoundingClientRect()
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      originalPosition.current = scrollTop + rect.top
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isSticky])

  // Measure bar height for smooth spacer transitions
  useEffect(() => {
    const updateHeight = () => {
      if (innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect()
        setBarHeight(rect.height)
      }
    }
    
    updateHeight()
    const resizeObserver = new ResizeObserver(updateHeight)
    if (innerRef.current) {
      resizeObserver.observe(innerRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [activeFilters, isSticky])

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

  const handleBudgetChange = (range: [number, number]) => {
    setBudgetRange(range)
    const newFilters = { ...activeFilters }
    newFilters['budget'] = [`₹${range[0]} - ₹${range[1]}`]
    setActiveFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setBudgetRange([6899, 28699])
    onFiltersChange?.({})
  }

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((acc, filters) => acc + filters.length, 0)
  }

  const BudgetRangeSlider = () => {
    const [localRange, setLocalRange] = useState(budgetRange)
    const sliderRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)

    // Update local range when budgetRange prop changes
    useEffect(() => {
      setLocalRange(budgetRange)
    }, [budgetRange])

    const getPercentage = (value: number) => {
      const min = 6899
      const max = 28699
      return ((value - min) / (max - min)) * 100
    }

    const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(type)
    }

    const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return
      
      const rect = sliderRef.current.getBoundingClientRect()
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
      const value = Math.round(6899 + (28699 - 6899) * percentage)
      
      setLocalRange(prev => {
        if (isDragging === 'min') {
          return [Math.min(value, prev[1] - 100), prev[1]]
        } else {
          return [prev[0], Math.max(value, prev[0] + 100)]
        }
      })
    }, [isDragging])

    const handleMouseUp = useCallback(() => {
      setIsDragging(null)
    }, [])

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.body.style.userSelect = 'none'
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
          document.body.style.userSelect = ''
        }
      }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const minPercent = getPercentage(localRange[0])
    const maxPercent = getPercentage(localRange[1])

    return (
      <div className="p-4 space-y-4">
        <h4 className="font-medium text-gray-900">Select Range</h4>
        
        {/* Price inputs */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">min price</label>
            <input
              type="text"
              value={`₹ ${localRange[0].toLocaleString()}`}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 6899
                const newMin = Math.max(6899, Math.min(value, localRange[1] - 100))
                setLocalRange([newMin, localRange[1]])
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-teal-500"
            />
          </div>
          <div className="text-gray-400 pt-6">—</div>
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">max price</label>
            <input
              type="text"
              value={`₹ ${localRange[1].toLocaleString()}`}
              onChange={(e) => {
                const value = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 28699
                const newMax = Math.min(28699, Math.max(value, localRange[0] + 100))
                setLocalRange([localRange[0], newMax])
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Slider */}
        <div className="relative py-4">
          <div
            ref={sliderRef}
            className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
          >
            {/* Active range */}
            <div
              className="absolute h-2 bg-teal-500 rounded-full"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`
              }}
            />
            
            {/* Min handle */}
            <div
              className={`absolute w-4 h-4 bg-teal-500 border-2 border-white rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 shadow-md ${
                isDragging === 'min' ? 'scale-110' : ''
              }`}
              style={{ left: `${minPercent}%`, top: '50%' }}
              onMouseDown={handleMouseDown('min')}
            />
            
            {/* Max handle */}
            <div
              className={`absolute w-4 h-4 bg-teal-500 border-2 border-white rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 shadow-md ${
                isDragging === 'max' ? 'scale-110' : ''
              }`}
              style={{ left: `${maxPercent}%`, top: '50%' }}
              onMouseDown={handleMouseDown('max')}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between pt-2">
          <button
            onClick={() => {
              setLocalRange([6899, 28699])
              handleBudgetChange([6899, 28699])
              setOpenDropdown(null)
            }}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => {
              handleBudgetChange(localRange)
              setOpenDropdown(null)
            }}
            className="px-4 py-2 bg-teal-500 text-white text-sm rounded hover:bg-teal-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    )
  }

  const getActiveFiltersByCategory = () => {
    const categoryMap: Record<string, { label: string; items: string[] }> = {}
    
    Object.entries(activeFilters).forEach(([filterId, values]) => {
      const filter = filters.find(f => f.id === filterId)
      if (filter && values.length > 0) {
        const categoryLabel = filter.label
        if (!categoryMap[categoryLabel]) {
          categoryMap[categoryLabel] = { label: categoryLabel, items: [] }
        }
        categoryMap[categoryLabel].items.push(...values.map(v => v === 'true' ? 'Allowed' : v))
      }
    })
    
    return categoryMap
  }

  return (
    <div className="w-full">
      <div 
        ref={containerRef}
        className={`w-full transition-all duration-300 ease-out ${
          isSticky 
            ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100' 
            : 'relative'
        }`}
      >
        <div 
          ref={innerRef}
          className={`max-w-7xl mx-auto px-4 transition-all duration-300 ease-out ${
            isSticky ? 'py-3' : 'py-4'
          }`}
          style={{ overflow: 'visible' }}
        >
          <div className="bg-white">
            {/* Top level tabs - always visible */}
            <div className={`flex items-center justify-between transition-all duration-300 ease-out ${
              isSticky ? 'mb-2' : 'mb-4'
            }`}>
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setActiveTab('pg_hostels')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'pg_hostels'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Home className="h-4 w-4" />
                  PG/Hostels
                </button>
                <button
                  onClick={() => setActiveTab('flats')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === 'flats'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  Flats
                </button>
              </div>

              {/* Sort dropdown */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                  >
                    Sort By: <span className="font-medium text-teal-600">{selectedSort}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${
                      openDropdown === 'sort' ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {openDropdown === 'sort' && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] min-w-[180px]">
                      <div className="p-2">
                        {sortOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedSort(option)
                              setOpenDropdown(null)
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedSort === option
                                ? 'bg-teal-50 text-teal-700'
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
              </div>
            </div>

            {/* Main filters row */}
            <div className={`flex items-center justify-between gap-4 transition-all duration-300 ease-out ${
              isSticky ? 'mb-0' : 'mb-4'
            }`}>
              <div className="flex items-center gap-3 flex-1">
                {filters.map((filter) => (
                  <div key={filter.id} className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenDropdown(openDropdown === filter.id ? null : filter.id)
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-gray-300 transition-all bg-white"
                    >
                      {filter.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                        openDropdown === filter.id ? 'rotate-180' : ''
                      }`} />
                    </button>

                    {/* Dropdown menu */}
                    {openDropdown === filter.id && (
                      <div 
                        className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[100]"
                        style={{ 
                          minWidth: filter.id === 'budget' ? '320px' : '180px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {filter.hasCustomDropdown && filter.id === 'budget' ? (
                          <BudgetRangeSlider />
                        ) : (
                          <div className="p-2 max-h-60 overflow-y-auto">
                            {filter.options?.map((option) => (
                              <button
                                key={option}
                                onClick={() => toggleFilter(filter.id, option)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  activeFilters[filter.id]?.includes(option)
                                    ? 'bg-teal-50 text-teal-700'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  {activeFilters[filter.id]?.includes(option) && (
                                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                                  )}
                                  {option}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'more' ? null : 'more')}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-200 rounded-lg hover:border-gray-300 transition-all"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  More Filters
                </button>

                {getActiveFilterCount() > 0 && !isSticky && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-gray-500 hover:text-red-600 underline transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Active filter chips by category - hidden when sticky */}
            {getActiveFilterCount() > 0 && !isSticky && (
              <div className="space-y-3">
                {Object.entries(getActiveFiltersByCategory()).map(([category, data]) => (
                  <div key={category} className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600 font-medium min-w-max">{category}</span>
                    {data.items.map((item, index) => (
                      <Badge
                        key={`${category}-${item}-${index}`}
                        variant="secondary"
                        className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                      >
                        {item}
                        <button
                          onClick={() => {
                            const filterId = filters.find(f => f.label === category)?.id
                            if (filterId) {
                              if (filterId === 'budget') {
                                setBudgetRange([6899, 28699])
                              }
                              toggleFilter(filterId, item === 'Allowed' ? 'true' : item)
                            }
                          }}
                          className="ml-1 hover:bg-teal-200 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Smooth spacer to prevent layout jumps */}
      <div 
        className="transition-all duration-300 ease-out overflow-hidden"
        style={{
          height: isSticky ? `${barHeight}px` : '0px'
        }}
      />
      
      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-[60]"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}