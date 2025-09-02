'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MapPin, Search, ChevronDown, Users, Home, Utensils, Cigarette, Building2, Settings, RotateCcw } from 'lucide-react'
import FilterSection from './FilterSection'
import PriceRangeSlider from './PriceRangeSlider'
import AmenityGrid from './AmenityGrid'
import FilterChips from './FilterChips'
import { Button } from '@/components/ui/button'

interface FilterState {
  // Search
  state: string
  area: string
  searchQuery: string
  
  // Core Filters
  localities: string[]
  budget: [number, number]
  gender: string
  brokerType: string
  
  // Extended Filters
  foodPreference: string
  lifestyle: string
  propertyTypes: string[]
  amenities: string[]
}

interface FilterContainerProps {
  onFiltersChange: (filters: FilterState) => void
  className?: string
}

// Mock data - replace with API calls
const hyderabadLocalities = [
  'Gachibowli', 'Hitec City', 'Kondapur', 'Kukatpally', 'Madhapur', 
  'Banjara Hills', 'Jubilee Hills', 'Begumpet', 'Secunderabad', 'Ameerpet',
  'Dilsukhnagar', 'LB Nagar', 'Uppal', 'Miyapur', 'Bachupally'
]

const propertyTypeOptions = [
  { id: 'gated_community', name: 'Gated Community', icon: <Building2 className="h-4 w-4" /> },
  { id: 'independent_house', name: 'Independent House', icon: <Home className="h-4 w-4" /> },
  { id: 'apartment', name: 'Apartment', icon: <Building2 className="h-4 w-4" /> }
]

export default function FilterContainer({ onFiltersChange, className = '' }: FilterContainerProps) {
  const [filters, setFilters] = useState<FilterState>({
    state: 'Telangana',
    area: 'Hyderabad',
    searchQuery: '',
    localities: [],
    budget: [6899, 28699],
    gender: '',
    brokerType: '',
    foodPreference: '',
    lifestyle: '',
    propertyTypes: [],
    amenities: []
  })

  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const [localitySearch, setLocalitySearch] = useState('')

  // Debounced filter updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange(filters)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [filters, onFiltersChange])

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilter = useCallback((key: keyof FilterState) => {
    const defaultValues: Partial<FilterState> = {
      localities: [],
      gender: '',
      brokerType: '',
      foodPreference: '',
      lifestyle: '',
      propertyTypes: [],
      amenities: []
    }
    
    if (key in defaultValues) {
      updateFilter(key, defaultValues[key] as FilterState[typeof key])
    }
  }, [updateFilter])

  const clearAllFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      localities: [],
      gender: '',
      brokerType: '',
      foodPreference: '',
      lifestyle: '',
      propertyTypes: [],
      amenities: []
    }))
  }, [])

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.localities.length > 0) count++
    if (filters.gender) count++
    if (filters.brokerType) count++
    if (filters.foodPreference) count++
    if (filters.lifestyle) count++
    if (filters.propertyTypes.length > 0) count++
    if (filters.amenities.length > 0) count++
    return count
  }

  const getFilterChips = () => {
    const chips: Array<{
      id: string
      label: string
      value: string
      category: string
      onRemove: () => void
    }> = []

    // Localities
    filters.localities.forEach(locality => {
      chips.push({
        id: `locality-${locality}`,
        label: 'Locality',
        value: locality,
        category: 'locality',
        onRemove: () => updateFilter('localities', filters.localities.filter(l => l !== locality))
      })
    })

    // Gender
    if (filters.gender) {
      chips.push({
        id: 'gender',
        label: 'Gender',
        value: filters.gender,
        category: 'gender',
        onRemove: () => updateFilter('gender', '')
      })
    }

    // Broker Type
    if (filters.brokerType) {
      chips.push({
        id: 'broker',
        label: 'Listing Type',
        value: filters.brokerType,
        category: 'broker',
        onRemove: () => updateFilter('brokerType', '')
      })
    }

    // Food Preference
    if (filters.foodPreference) {
      chips.push({
        id: 'food',
        label: 'Food',
        value: filters.foodPreference,
        category: 'food',
        onRemove: () => updateFilter('foodPreference', '')
      })
    }

    // Lifestyle
    if (filters.lifestyle) {
      chips.push({
        id: 'lifestyle',
        label: 'Lifestyle',
        value: filters.lifestyle,
        category: 'lifestyle',
        onRemove: () => updateFilter('lifestyle', '')
      })
    }

    // Property Types
    filters.propertyTypes.forEach(type => {
      const option = propertyTypeOptions.find(o => o.id === type)
      if (option) {
        chips.push({
          id: `property-${type}`,
          label: 'Property Type',
          value: option.name,
          category: 'property',
          onRemove: () => updateFilter('propertyTypes', filters.propertyTypes.filter(t => t !== type))
        })
      }
    })

    // Amenities (show count if more than 3)
    if (filters.amenities.length > 0) {
      chips.push({
        id: 'amenities',
        label: 'Amenities',
        value: filters.amenities.length > 3 
          ? `${filters.amenities.length} selected` 
          : filters.amenities.join(', '),
        category: 'amenities',
        onRemove: () => updateFilter('amenities', [])
      })
    }

    return chips
  }

  const filteredLocalities = hyderabadLocalities.filter(locality =>
    locality.toLowerCase().includes(localitySearch.toLowerCase())
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Section */}
      <FilterSection title="Search Destination">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.state}
                  onChange={(e) => updateFilter('state', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Select state"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.area}
                  onChange={(e) => updateFilter('area', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Select area"
                />
              </div>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              placeholder="Search destinations"
            />
          </div>
        </div>
      </FilterSection>

      {/* Quick Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Locality Filter */}
        <FilterSection 
          title="Locality" 
          activeCount={filters.localities.length}
          onClear={() => clearFilter('localities')}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={localitySearch}
                onChange={(e) => setLocalitySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                placeholder="Search localities"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredLocalities.map(locality => (
                <label key={locality} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.localities.includes(locality)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFilter('localities', [...filters.localities, locality])
                      } else {
                        updateFilter('localities', filters.localities.filter(l => l !== locality))
                      }
                    }}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{locality}</span>
                </label>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Budget Filter */}
        <FilterSection title="Budget">
          <PriceRangeSlider
            min={5000}
            max={50000}
            value={filters.budget}
            onChange={(value) => updateFilter('budget', value)}
            step={100}
            formatValue={(val) => `₹${val.toLocaleString()}`}
          />
        </FilterSection>

        {/* Gender Filter */}
        <FilterSection 
          title="Gender Preference" 
          activeCount={filters.gender ? 1 : 0}
          onClear={() => clearFilter('gender')}
        >
          <div className="space-y-2">
            {[
              { value: 'male', label: 'Male', icon: <Users className="h-4 w-4" /> },
              { value: 'female', label: 'Female', icon: <Users className="h-4 w-4" /> },
              { value: 'unisex', label: 'Unisex', icon: <Users className="h-4 w-4" /> }
            ].map(option => (
              <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={filters.gender === option.value}
                  onChange={(e) => updateFilter('gender', e.target.value)}
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                  {option.icon}
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Broker Filter */}
        <FilterSection 
          title="Listing Type" 
          activeCount={filters.brokerType ? 1 : 0}
          onClear={() => clearFilter('brokerType')}
        >
          <div className="space-y-2">
            {[
              { value: 'owner', label: 'Owner Direct' },
              { value: 'broker', label: 'Broker Listings' }
            ].map(option => (
              <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="brokerType"
                  value={option.value}
                  checked={filters.brokerType === option.value}
                  onChange={(e) => updateFilter('brokerType', e.target.value)}
                  className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* More Filters Toggle */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className="flex items-center gap-2 px-6 py-3 border-2 border-teal-200 text-teal-700 hover:bg-teal-50 rounded-xl transition-all"
        >
          <Settings className="h-4 w-4" />
          More Filters
          {getActiveFilterCount() > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-teal-500 rounded-full ml-1">
              {getActiveFilterCount() - (filters.gender ? 1 : 0) - (filters.brokerType ? 1 : 0)}
            </span>
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Extended Filters */}
      {showMoreFilters && (
        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Food Preferences */}
            <FilterSection 
              title="Food Preference" 
              activeCount={filters.foodPreference ? 1 : 0}
              onClear={() => clearFilter('foodPreference')}
            >
              <div className="space-y-2">
                {[
                  { value: 'vegetarian', label: 'Vegetarian', icon: <Utensils className="h-4 w-4 text-green-500" /> },
                  { value: 'non_vegetarian', label: 'Non-Vegetarian', icon: <Utensils className="h-4 w-4 text-red-500" /> },
                  { value: 'both', label: 'Both', icon: <Utensils className="h-4 w-4 text-gray-500" /> }
                ].map(option => (
                  <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="foodPreference"
                      value={option.value}
                      checked={filters.foodPreference === option.value}
                      onChange={(e) => updateFilter('foodPreference', e.target.value)}
                      className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      {option.icon}
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Lifestyle Preferences */}
            <FilterSection 
              title="Lifestyle" 
              activeCount={filters.lifestyle ? 1 : 0}
              onClear={() => clearFilter('lifestyle')}
            >
              <div className="space-y-2">
                {[
                  { value: 'smoker', label: 'Smoker', icon: <Cigarette className="h-4 w-4 text-orange-500" /> },
                  { value: 'non_smoker', label: 'Non-Smoker', icon: <Cigarette className="h-4 w-4 text-green-500" /> },
                  { value: 'no_preference', label: 'No Preference', icon: <Cigarette className="h-4 w-4 text-gray-500" /> }
                ].map(option => (
                  <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      name="lifestyle"
                      value={option.value}
                      checked={filters.lifestyle === option.value}
                      onChange={(e) => updateFilter('lifestyle', e.target.value)}
                      className="h-4 w-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                    />
                    <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      {option.icon}
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Property Type */}
            <FilterSection 
              title="Property Type" 
              activeCount={filters.propertyTypes.length}
              onClear={() => clearFilter('propertyTypes')}
            >
              <div className="space-y-2">
                {propertyTypeOptions.map(option => (
                  <label key={option.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.propertyTypes.includes(option.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateFilter('propertyTypes', [...filters.propertyTypes, option.id])
                        } else {
                          updateFilter('propertyTypes', filters.propertyTypes.filter(t => t !== option.id))
                        }
                      }}
                      className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <span className="ml-2 flex items-center gap-2 text-sm text-gray-700">
                      {option.icon}
                      {option.name}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>
          </div>

          {/* Amenities */}
          <FilterSection 
            title="Amenities" 
            activeCount={filters.amenities.length}
            onClear={() => clearFilter('amenities')}
          >
            <AmenityGrid
              selectedAmenities={filters.amenities}
              onSelectionChange={(amenities) => updateFilter('amenities', amenities)}
            />
          </FilterSection>
        </div>
      )}

      {/* Active Filter Chips */}
      <FilterChips
        chips={getFilterChips()}
        onClearAll={clearAllFilters}
      />

      {/* Clear All Button */}
      {getActiveFilterCount() > 0 && (
        <div className="flex justify-center pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-6 py-3 text-red-600 border-red-200 hover:bg-red-50 rounded-xl transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  )
}