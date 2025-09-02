'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X, SlidersHorizontal, Home, Building2, Utensils, Cigarette, CigaretteOff, Shield, Waves, Dumbbell, Snowflake, Bath, Archive, Package, Fan, Wifi, Car, Zap, Droplets, ShirtIcon } from 'lucide-react'

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
    id: 'bhk',
    label: 'BHK',
    type: 'select',
    options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Full Flat']
  },
  {
    id: 'broker',
    label: 'Broker',
    type: 'select',
    options: ['No Broker', 'Broker']
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Unisex']
  }
]

// More filters for the expanded dropdown
const moreFilters = {
  occupancy: {
    label: 'Occupancy',
    options: [
      { id: 'single', label: 'Single Occupancy' },
      { id: 'double', label: 'Double Occupancy' },
      { id: 'triple', label: 'Triple Occupancy' },
      { id: 'quadruple', label: 'Quadruple Occupancy' },
      { id: 'quintuple', label: 'Quintuple Occupancy' },
      { id: 'dorm', label: 'Dorm' }
    ]
  },
  amenities: {
    label: 'Amenities',
    options: [
      { id: 'attached_balcony', label: 'Attached Balcony' },
      { id: 'air_conditioning', label: 'Air Conditioning' },
      { id: 'attached_washroom', label: 'Attached Washroom' },
      { id: 'storage_shelf', label: 'Storage Shelf' },
      { id: 'spacious_cupboard', label: 'Spacious Cupboard' },
      { id: 'desert_cooler', label: 'Desert Cooler' },
      { id: 'wifi', label: 'WiFi' },
      { id: 'laundry', label: 'Laundry' },
      { id: 'parking', label: 'Parking' },
      { id: 'security', label: '24/7 Security' },
      { id: 'power_backup', label: 'Power Backup' },
      { id: 'water_supply', label: 'Water Supply' },
      { id: 'gym', label: 'Gym' },
      { id: 'swimming_pool', label: 'Swimming Pool' }
    ]
  },
  food: {
    label: 'Food Preferences',
    options: [
      { id: 'vegetarian', label: 'Vegetarian' },
      { id: 'non_vegetarian', label: 'Non-Vegetarian' },
      { id: 'both', label: 'Both' }
    ]
  },
  lifestyle: {
    label: 'Lifestyle Preferences',
    options: [
      { id: 'smoker', label: 'Smoker' },
      { id: 'non_smoker', label: 'Non-Smoker' },
      { id: 'no_preference', label: 'No Preference' }
    ]
  },
  property_type: {
    label: 'Property Type',
    options: [
      { id: 'gated_community', label: 'Gated Community' },
      { id: 'independent_house', label: 'Independent House' },
      { id: 'apartment', label: 'Apartment' }
    ]
  }
}

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
  const [budgetRange, setBudgetRange] = useState<[number, number]>([6899, 200000])
  const [activeTab, setActiveTab] = useState<'pg_hostels' | 'flats'>('pg_hostels')
  const [selectedSort, setSelectedSort] = useState('Distance')
  const [moreFiltersState, setMoreFiltersState] = useState<Record<string, string[]>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const originalPosition = useRef<number>(0)

  useEffect(() => {
    let ticking = false
    const threshold = 5 // Add small threshold to prevent flickering

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (containerRef.current) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            
            // Set initial position only once
            if (originalPosition.current === 0) {
              const rect = containerRef.current.getBoundingClientRect()
              originalPosition.current = scrollTop + rect.top
            }
            
            // Use threshold to prevent flickering
            const shouldBeSticky = scrollTop >= (originalPosition.current - threshold)
            
            // Only update state if there's a real change
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

    // Initial setup
    const initializePosition = () => {
      if (containerRef.current && originalPosition.current === 0) {
        const rect = containerRef.current.getBoundingClientRect()
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop
        originalPosition.current = scrollTop + rect.top
      }
    }

    // Run on mount and resize
    initializePosition()
    window.addEventListener('resize', initializePosition)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', initializePosition)
    }
  }, [isSticky])

  // Measure bar height for smooth spacer transitions
  useEffect(() => {
    const updateHeight = () => {
      if (innerRef.current) {
        const rect = innerRef.current.getBoundingClientRect()
        // Only update height if there's a significant change to prevent micro-adjustments
        const newHeight = rect.height
        if (Math.abs(newHeight - barHeight) > 2) {
          setBarHeight(newHeight)
        }
      }
    }
    
    // Debounce height updates
    let timeoutId: NodeJS.Timeout
    const debouncedUpdateHeight = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateHeight, 50)
    }
    
    updateHeight()
    const resizeObserver = new ResizeObserver(debouncedUpdateHeight)
    if (innerRef.current) {
      resizeObserver.observe(innerRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeoutId)
    }
  }, [activeFilters, isSticky, barHeight])

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
    setBudgetRange([6899, 200000])
    setMoreFiltersState({})
    onFiltersChange?.({})
  }

  const getActiveFilterCount = () => {
    const mainFiltersCount = Object.values(activeFilters).reduce((acc, filters) => acc + filters.length, 0)
    const moreFiltersCount = Object.values(moreFiltersState).reduce((acc, filters) => acc + filters.length, 0)
    return mainFiltersCount + moreFiltersCount
  }

  const toggleMoreFilter = (category: string, value: string) => {
    const newMoreFilters = { ...moreFiltersState }
    if (!newMoreFilters[category]) {
      newMoreFilters[category] = []
    }
    
    if (category === 'amenities') {
      // Multi-select for amenities
      if (newMoreFilters[category].includes(value)) {
        newMoreFilters[category] = newMoreFilters[category].filter(v => v !== value)
        if (newMoreFilters[category].length === 0) {
          delete newMoreFilters[category]
        }
      } else {
        newMoreFilters[category] = [...newMoreFilters[category], value]
      }
    } else {
      // Single select for other categories
      if (newMoreFilters[category].includes(value)) {
        delete newMoreFilters[category]
      } else {
        newMoreFilters[category] = [value]
      }
    }
    
    setMoreFiltersState(newMoreFilters)
    // Combine with main filters for callback
    onFiltersChange?.({ ...activeFilters, ...newMoreFilters })
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
      const max = 200000
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
        const value = Math.round(6899 + (200000 - 6899) * percentage)
      
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
                                 const newMin = Math.max(6899, Math.min(value, localRange[1] - 1000))
                 setLocalRange([newMin, localRange[1]])
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-purple-500"
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
                                 const newMax = Math.min(200000, Math.max(value, localRange[0] + 1000))
                 setLocalRange([localRange[0], newMax])
              }}
              onFocus={(e) => e.target.select()}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:border-purple-500"
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
               className="absolute h-2 bg-purple-500 rounded-full"
               style={{
                 left: `${minPercent}%`,
                 width: `${maxPercent - minPercent}%`
               }}
             />
             
             {/* Min handle */}
             <div
               className={`absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 shadow-md ${
                 isDragging === 'min' ? 'scale-110' : ''
               }`}
               style={{ left: `${minPercent}%`, top: '50%' }}
               onMouseDown={handleMouseDown('min')}
             />
             
             {/* Max handle */}
             <div
               className={`absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 shadow-md ${
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
               setLocalRange([6899, 200000])
               handleBudgetChange([6899, 200000])
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
             className="px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
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
        className={`w-full transition-all duration-200 ease-out ${
          isSticky 
            ? 'fixed top-0 left-0 right-0 z-[9999] bg-white shadow-sm border-b border-gray-100' 
            : 'relative z-10'
        }`}
        style={{
          transform: isSticky ? 'translateZ(0)' : 'none', // Force hardware acceleration
          willChange: 'transform, position' // Optimize for animations
        }}
      >
        <div 
          ref={innerRef}
          className={`max-w-7xl mx-auto px-4 transition-all duration-300 ease-out ${
            isSticky ? 'py-3' : 'py-4'
          }`}
          style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}
        >
          <div className="bg-white" style={{ overflow: 'visible' }}>
            {/* Top level tabs - always visible */}

            {/* Main filters row */}
            <div className={`flex items-center justify-between gap-4 transition-all duration-300 ease-out ${
              isSticky ? 'mb-0' : 'mb-4'
            }`}>
              <div className="flex items-center gap-3 flex-1">
              {filters.map((filter) => (
                <div key={filter.id} className="relative z-[99998]">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setOpenDropdown(openDropdown === filter.id ? null : filter.id)
                    }}
                       className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-full transition-all duration-200 font-medium ${
                        activeFilters[filter.id]?.length 
                           ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                           : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                      }`}
                    >
                    {filter.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${
                          openDropdown === filter.id ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {/* Dropdown menu */}
                    {openDropdown === filter.id && (
                      <div 
                        className="absolute left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-visible"
                        style={{ 
                          top: '100%',
                          marginTop: '8px',
                          minWidth: filter.id === 'budget' ? '320px' : '280px',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          zIndex: 99999
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                                                 {filter.hasCustomDropdown && filter.id === 'budget' ? (
                           <BudgetRangeSlider />
                         ) : (
                           <div className="p-4">
                             <div className="flex flex-wrap gap-2">
                               {filter.options?.map((option) => (
                          <button
                            key={option}
                                   onClick={(e) => {
                                     e.preventDefault()
                                     e.stopPropagation()
                                     toggleFilter(filter.id, option)
                                   }}
                                   className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                                activeFilters[filter.id]?.includes(option)
                                       ? 'bg-purple-500 text-white border-purple-500 shadow-md transform scale-105'
                                       : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                           </div>
                         )}
                    </div>
                  )}
                  </div>
                ))}
              </div>

                             <div className="flex items-center gap-3">
                 <div className="relative z-[99998]">
                   <button
                     onClick={(e) => {
                       e.preventDefault()
                       e.stopPropagation()
                       setOpenDropdown(openDropdown === 'more' ? null : 'more')
                     }}
                     className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-full transition-all duration-200 font-medium ${
                       Object.keys(moreFiltersState).length > 0
                         ? 'bg-purple-500 text-white border-purple-500 shadow-md'
                         : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                     }`}
                   >
                     <SlidersHorizontal className="h-4 w-4" />
                     More Filters
                     {Object.keys(moreFiltersState).length > 0 && (
                       <span className="ml-1 bg-white text-purple-500 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                         {Object.values(moreFiltersState).reduce((acc, filters) => acc + filters.length, 0)}
                       </span>
                     )}
                     <ChevronDown className={`h-4 w-4 transition-transform ${
                       openDropdown === 'more' ? 'rotate-180' : ''
                     }`} />
                   </button>

                  {openDropdown === 'more' && (
                    <div 
                      className="absolute right-0 bg-white border border-gray-200 rounded-xl shadow-2xl w-[600px] max-h-[600px] overflow-y-auto"
                      style={{
                        top: '100%',
                        marginTop: '8px',
                        zIndex: 99999
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                       <div className="p-8">
                         <div className="flex items-center justify-between mb-8">
                           <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
                           <button
                             onClick={() => setOpenDropdown(null)}
                             className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                           >
                             <X className="h-5 w-5 text-gray-400" />
                           </button>
                         </div>
                         
                         <div className="space-y-10">
                           {Object.entries(moreFilters).map(([categoryKey, category]) => (
                             <div key={categoryKey} className="space-y-5">
                               <h4 className="text-lg font-medium text-gray-900 mb-4">{category.label}</h4>
                               
                               <div className="flex flex-wrap gap-3">
                                 {category.options.map((option) => {
                                   const isSelected = moreFiltersState[categoryKey]?.includes(option.id) || false
                                   return (
                                     <button
                                       key={option.id}
                                       onClick={(e) => {
                                         e.preventDefault()
                                         e.stopPropagation()
                                         toggleMoreFilter(categoryKey, option.id)
                                       }}
                                       className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
                                         isSelected
                                           ? 'bg-purple-500 text-white border-purple-500 shadow-lg transform scale-105'
                                           : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 hover:shadow-md'
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

                         {/* Action buttons */}
                         <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100">
                           <button
                             onClick={() => {
                               setMoreFiltersState({})
                               onFiltersChange?.(activeFilters)
                             }}
                             className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
                           >
                             Clear All
                           </button>
                           <button
                             onClick={() => setOpenDropdown(null)}
                             className="px-8 py-3 bg-purple-500 text-white text-sm font-medium rounded-full hover:bg-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                           >
                             Apply Filters
                           </button>
                         </div>
                       </div>
                     </div>
            )}
        </div>

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

                         {/* Active filter chips - all in one line - hidden when sticky */}
             {getActiveFilterCount() > 0 && !isSticky && (
               <div className="flex flex-wrap items-center gap-2">
                 {/* Main filters */}
            {Object.entries(activeFilters).map(([filterId, values]) => 
                   values.map((value) => {
                     const filter = filters.find(f => f.id === filterId)
                     return (
                  <Badge
                    key={`${filterId}-${value}`}
                    variant="secondary"
                         className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                       >
                         <span className="text-xs text-gray-500 mr-1">{filter?.label}:</span>
                         {value === 'true' ? 'Allowed' : value}
                         <button
                           onClick={() => {
                             if (filterId === 'budget') {
                               setBudgetRange([6899, 28699])
                             }
                             toggleFilter(filterId, value)
                           }}
                           className="ml-1 hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                         >
                           <X className="h-3 w-3" />
                         </button>
                       </Badge>
                     )
                   })
                 )}
                 
                 {/* More filters */}
                 {Object.entries(moreFiltersState).map(([categoryKey, values]) => 
                   values.map((value) => {
                     const category = moreFilters[categoryKey as keyof typeof moreFilters]
                     const option = category?.options.find(opt => opt.id === value)
                     return (
                       <Badge
                         key={`more-${categoryKey}-${value}`}
                         variant="secondary"
                         className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                       >
                         <span className="text-xs text-gray-500 mr-1">{category?.label}:</span>
                         {option?.label || value}
                    <button
                           onClick={() => toggleMoreFilter(categoryKey, value)}
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
      
      {/* Smooth spacer to prevent layout jumps */}
      <div 
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          height: isSticky ? `${barHeight}px` : '0px',
          transform: 'translateZ(0)', // Force hardware acceleration
          willChange: 'height'
        }}
      />

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 99997 }}
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}