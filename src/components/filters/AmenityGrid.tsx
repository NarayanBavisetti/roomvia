'use client'

import React from 'react'
import { 
  Waves, 
  Dumbbell, 
  Snowflake, 
  Bath, 
  Archive, 
  Package, 
  Fan, 
  Building2, 
  Wifi, 
  ShirtIcon, 
  Car, 
  Shield, 
  Zap, 
  Droplets,
  Check
} from 'lucide-react'

interface AmenityItem {
  id: string
  name: string
  icon: React.ReactNode
  category?: string
}

interface AmenityGridProps {
  selectedAmenities: string[]
  onSelectionChange: (amenities: string[]) => void
  className?: string
}

const amenities: AmenityItem[] = [
  { id: 'swimming_pool', name: 'Swimming Pool', icon: <Waves className="h-5 w-5" />, category: 'recreation' },
  { id: 'gym', name: 'Gym', icon: <Dumbbell className="h-5 w-5" />, category: 'recreation' },
  { id: 'ac', name: 'AC', icon: <Snowflake className="h-5 w-5" />, category: 'comfort' },
  { id: 'attached_washroom', name: 'Attached Washroom', icon: <Bath className="h-5 w-5" />, category: 'comfort' },
  { id: 'storage_shelf', name: 'Storage Shelf', icon: <Archive className="h-5 w-5" />, category: 'storage' },
  { id: 'cupboard', name: 'Spacious Cupboard', icon: <Package className="h-5 w-5" />, category: 'storage' },
  { id: 'desert_cooler', name: 'Desert Cooler', icon: <Fan className="h-5 w-5" />, category: 'comfort' },
  { id: 'balcony', name: 'Attached Balcony', icon: <Building2 className="h-5 w-5" />, category: 'space' },
  { id: 'wifi', name: 'WiFi', icon: <Wifi className="h-5 w-5" />, category: 'connectivity' },
  { id: 'laundry', name: 'Laundry', icon: <ShirtIcon className="h-5 w-5" />, category: 'services' },
  { id: 'parking', name: 'Parking', icon: <Car className="h-5 w-5" />, category: 'convenience' },
  { id: 'security', name: '24/7 Security', icon: <Shield className="h-5 w-5" />, category: 'safety' },
  { id: 'power_backup', name: 'Power Backup', icon: <Zap className="h-5 w-5" />, category: 'utilities' },
  { id: 'water_supply', name: 'Water Supply', icon: <Droplets className="h-5 w-5" />, category: 'utilities' },
]

const categoryColors = {
  recreation: 'border-blue-200 hover:border-blue-300 text-blue-700 bg-blue-50',
  comfort: 'border-green-200 hover:border-green-300 text-green-700 bg-green-50',
  storage: 'border-orange-200 hover:border-orange-300 text-orange-700 bg-orange-50',
  space: 'border-purple-200 hover:border-purple-300 text-purple-700 bg-purple-50',
  connectivity: 'border-teal-200 hover:border-teal-300 text-teal-700 bg-teal-50',
  services: 'border-pink-200 hover:border-pink-300 text-pink-700 bg-pink-50',
  convenience: 'border-yellow-200 hover:border-yellow-300 text-yellow-700 bg-yellow-50',
  safety: 'border-red-200 hover:border-red-300 text-red-700 bg-red-50',
  utilities: 'border-gray-200 hover:border-gray-300 text-gray-700 bg-gray-50',
}

export default function AmenityGrid({
  selectedAmenities,
  onSelectionChange,
  className = ''
}: AmenityGridProps) {
  const handleToggleAmenity = (amenityId: string) => {
    const updatedSelection = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId]
    
    onSelectionChange(updatedSelection)
  }

  const handleSelectAll = () => {
    if (selectedAmenities.length === amenities.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(amenities.map(a => a.id))
    }
  }

  const isAllSelected = selectedAmenities.length === amenities.length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Select All / Clear All */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {selectedAmenities.length} of {amenities.length} selected
        </span>
        <button
          onClick={handleSelectAll}
          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          {isAllSelected ? 'Clear All' : 'Select All'}
        </button>
      </div>

      {/* Amenities Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {amenities.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.id)
          const categoryColor = categoryColors[amenity.category as keyof typeof categoryColors] || categoryColors.utilities
          
          return (
            <button
              key={amenity.id}
              onClick={() => handleToggleAmenity(amenity.id)}
              className={`relative flex flex-col items-center gap-2 p-3 border-2 rounded-xl transition-all duration-200 hover:scale-105 ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                  : `${categoryColor} hover:shadow-md`
              }`}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </div>
              )}
              
              {/* Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isSelected 
                  ? 'bg-teal-100' 
                  : 'bg-white shadow-sm'
              }`}>
                {amenity.icon}
              </div>
              
              {/* Name */}
              <span className={`text-xs font-medium text-center leading-tight ${
                isSelected ? 'text-teal-700' : 'text-gray-700'
              }`}>
                {amenity.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Count Summary */}
      {selectedAmenities.length > 0 && (
        <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-teal-800">
              {selectedAmenities.length} amenities selected
            </span>
            <button
              onClick={() => onSelectionChange([])}
              className="text-sm text-teal-600 hover:text-teal-700 underline"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}