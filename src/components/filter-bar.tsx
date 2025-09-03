'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useSavedFilters, type SavedFilter } from '@/hooks/useSavedFilters'

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


interface FilterBarProps {
  onFiltersChange?: (filters: Record<string, string[]>) => void
  searchLocation?: string
  searchArea?: string
}


export default function FilterBar({ onFiltersChange, searchLocation, searchArea }: FilterBarProps) {
  const { user } = useAuth()
  const [isSticky] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([6899, 200000])
  const [activeTab] = useState<'flats' | 'flats'>('flats')
  const [moreFiltersState, setMoreFiltersState] = useState<Record<string, string[]>>({})
  const containerRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)

  // Use the saved filters hook
  const {
    savedFilters,
    error: savedFiltersError,
    debouncedSave,
    clearFilters: clearSavedFilters
  } = useSavedFilters({
    searchLocation,
    searchArea,
    autoLoadOnMount: true,
    debounceDelay: 1000
  })

  // Auto-apply most recent filter when saved filters are loaded
  useEffect(() => {
    if (savedFilters.length > 0) {
      const mostRecentFilter = savedFilters[0]
      console.log('Auto-applying most recent filter:', mostRecentFilter)
      applyFiltersSilently(mostRecentFilter)
    }
  }, [savedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyFiltersSilently = (savedFilter: SavedFilter) => {
    // Apply filters without triggering onFiltersChange to avoid infinite loops
    if (savedFilter.min_rent && savedFilter.max_rent) {
      setBudgetRange([savedFilter.min_rent, savedFilter.max_rent])
    }
    
    if (savedFilter.filters) {
      // Separate main filters from more filters
      const mainFilterIds = filters.map(f => f.id)
      const mainFilters: Record<string, string[]> = {}
      const moreFilters: Record<string, string[]> = {}
      
      Object.entries(savedFilter.filters).forEach(([key, value]) => {
        if (mainFilterIds.includes(key)) {
          mainFilters[key] = value as string[]
        } else {
          moreFilters[key] = value as string[]
        }
      })
      
      setActiveFilters(mainFilters)
      setMoreFiltersState(moreFilters)
      
      // Now trigger onFiltersChange with the loaded filters
      onFiltersChange?.({ ...mainFilters, ...moreFilters })
    }
  }

  // Helper function to save filters (supports passing freshly computed filters to avoid stale state)
  const saveCurrentFilters = useCallback((filtersOverride?: Record<string, string[]>) => {
    const allFilters = filtersOverride ?? { ...activeFilters, ...moreFiltersState }
    debouncedSave(allFilters, {
      property_type: activeTab,
      min_rent: budgetRange[0],
      max_rent: budgetRange[1],
      amenities: (filtersOverride ?? moreFiltersState).amenities || []
    })
  }, [activeFilters, moreFiltersState, debouncedSave, activeTab, budgetRange])

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
      
      // Auto-save filters with freshly computed state if user is logged in
      if (user) {
        const merged = { ...newFilters, ...moreFiltersState }
        saveCurrentFilters(merged)
      }
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
      
      // Auto-save filters with freshly computed state if user is logged in
      if (user) {
        const merged = { ...newFilters, ...moreFiltersState }
        saveCurrentFilters(merged)
      }
    }
    // Keep dropdown open for multiple selections - don't close it
  }

  const handleBudgetChange = (range: [number, number]) => {
    setBudgetRange(range)
    const newFilters = { ...activeFilters }
    newFilters['budget'] = [`₹${range[0]} - ₹${range[1]}`]
    setActiveFilters(newFilters)
    onFiltersChange?.(newFilters)
    
    // Auto-save filters with freshly computed state if user is logged in
    if (user) {
      const merged = { ...newFilters, ...moreFiltersState }
      saveCurrentFilters(merged)
    }
  }

  const clearAllFilters = async () => {
    setActiveFilters({})
    setBudgetRange([6899, 200000])
    setMoreFiltersState({})
    onFiltersChange?.({})
    
    // Delete the user's saved filters from database using the hook
    if (user) {
      try {
        await clearSavedFilters()
        console.log('Cleared filters from database')
      } catch (error) {
        console.error('Error clearing filters from database:', error)
      }
    }
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
    const combined = { ...activeFilters, ...newMoreFilters }
    onFiltersChange?.(combined)
    
    // Auto-save filters with freshly computed state if user is logged in
    if (user) {
      saveCurrentFilters(combined)
    }
  }

  const BudgetRangeSlider = () => {
    const [localRange, setLocalRange] = useState(budgetRange)
    const sliderRef = useRef<HTMLDivElement>(null)
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)

    // Update local range when budgetRange prop changes
    useEffect(() => {
      setLocalRange(budgetRange)
    }, [budgetRange]) // eslint-disable-line react-hooks/exhaustive-deps

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
      <div>
        <div className="px-5 py-4 space-y-4">
        
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

        </div>
        
        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              setLocalRange([6899, 200000])
              handleBudgetChange([6899, 200000])
              setOpenDropdown(null)
            }}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
          >
            Clear All
          </button>
          <button
            onClick={() => {
              handleBudgetChange(localRange)
              setOpenDropdown(null)
            }}
            className="px-5 py-2 bg-purple-500 text-white text-xs font-medium rounded-full hover:bg-purple-600 transition-all duration-200 shadow-md"
          >
            Apply
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="w-full sticky top-0 z-[9999]">
      <div 
        ref={containerRef}
        className={`w-full transition-all duration-200 ease-out ${
          isSticky 
            ? 'fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-100' 
            : 'relative z-10'
        }`}
        style={{
          pointerEvents: 'auto'
        }}
      >
        <div 
          ref={innerRef}
          className={`max-w-7xl mx-auto sm:px-6 lg:px-8 transition-all duration-300 ease-out bg-white border-b border-gray-100/20 ${
            isSticky ? 'py-3' : 'py-4'
          }`}
          style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}
        >
          <div style={{ overflow: 'visible' }}>
            {/* Top level tabs - always visible */}

            {/* Main filters row */}
            <div className={`flex items-center justify-between gap-4 transition-all duration-300 ease-out`}>
              <div className="flex items-center gap-3 flex-1">
              {filters.map((filter) => (
                <div key={filter.id} className="relative z-20">
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

                        className="absolute z-20 left-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-visible"
                        style={{ 
                          top: '100%',
                          marginTop: '8px',
                          minWidth: filter.id === 'budget' ? '320px' : '280px',
                          maxHeight: '400px',
                          overflowY: 'auto',
                          zIndex: 100
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                                                 {filter.hasCustomDropdown && filter.id === 'budget' ? (
                           <BudgetRangeSlider />
                         ) : (
                           <div className="px-5 py-4">
                             <div className="flex flex-wrap gap-2">
                               {filter.options?.map((option) => (
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
                    </div>
                  )}
                  </div>
                ))}
              </div>

                             <div className="flex items-center gap-3">
                 <div className="relative z-20">
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
                      className="absolute right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-[480px]"
                      style={{
                        top: '100%',
                        marginTop: '8px',
                        zIndex: 100,
                        maxHeight: '520px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header */}
                      <div className="px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                          <button onClick={() => setOpenDropdown(null)} className="p-1.5 hover:bg-gray-50 rounded-full transition-colors">
                            <X className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable content */}
                      <div style={{ maxHeight: '380px', overflowY: 'auto', overflowX: 'hidden' }} className="px-5 py-4 space-y-6">
                        {Object.entries(moreFilters).map(([categoryKey, category]) => (
                          <div key={categoryKey} className="space-y-3">
                            <h4 className="text-base font-semibold text-gray-900">{category.label}</h4>
                            <div className="flex flex-wrap gap-2">
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

                      {/* Footer */}
                      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setMoreFiltersState({})
                            onFiltersChange?.(activeFilters)
                          }}
                          className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full transition-all duration-200"
                        >
                          Clear All
                        </button>
                        <button
                          onClick={() => setOpenDropdown(null)}
                          className="px-5 py-2 bg-purple-500 text-white text-xs font-medium rounded-full hover:bg-purple-600 transition-all duration-200 shadow-md"
                        >
                          Apply Filters
                        </button>
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

                         {/* Error message for saved filters */}
             {savedFiltersError && (
               <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                 <span>⚠️ Error with saved filters: {savedFiltersError}</span>
               </div>
             )}

                         {/* Active filter chips - all in one line - hidden when sticky */}
             {getActiveFilterCount() > 0 && !isSticky && (
               <div className="flex flex-wrap items-center gap-2 mt-4">
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
          height: isSticky ? '80px' : '0px'
        }}
      />


{openDropdown && (
<div className='z-[19] absolute inset-0' onClick={() => setOpenDropdown(null)}/>
)}
      
    </div>
  )
}