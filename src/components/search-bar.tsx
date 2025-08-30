'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (location: string, area: string) => void
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')

  const handleSearch = () => {
    onSearch?.(location, area)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-24 mb-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Find your perfect <span className="text-blue-600">room</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover amazing flats and flatmates in your preferred location with ease
        </p>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Location Input */}
          <div className="flex-1 relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Enter city (e.g., Bangalore, Mumbai)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 h-14 text-lg border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl"
            />
          </div>

          {/* Area Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Area (e.g., Koramangala, Indiranagar)"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-12 h-14 text-lg border-0 bg-gray-50 focus:bg-white transition-colors rounded-xl"
            />
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch}
            className="h-14 px-8 text-lg font-semibold bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            <Search className="mr-2 h-5 w-5" />
            Search
          </Button>
        </div>
      </div>

      {/* Quick suggestions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-3">Popular searches:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {[
            'Koramangala',
            'Indiranagar',
            'HSR Layout',
            'Whitefield',
            'Electronic City',
            'Bellandur'
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setArea(suggestion)}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}