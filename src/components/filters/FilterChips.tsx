'use client'

import React from 'react'
import { X, RotateCcw } from 'lucide-react'

interface FilterChip {
  id: string
  label: string
  value: string
  category: string
  onRemove: () => void
}

interface FilterChipsProps {
  chips: FilterChip[]
  onClearAll: () => void
  className?: string
}

const categoryColors = {
  locality: 'bg-blue-100 text-blue-800 border-blue-200',
  budget: 'bg-green-100 text-green-800 border-green-200',
  gender: 'bg-purple-100 text-purple-800 border-purple-200',
  broker: 'bg-orange-100 text-orange-800 border-orange-200',
  food: 'bg-pink-100 text-pink-800 border-pink-200',
  lifestyle: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  property: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  amenities: 'bg-teal-100 text-teal-800 border-teal-200',
  default: 'bg-gray-100 text-gray-800 border-gray-200'
}

export default function FilterChips({
  chips,
  onClearAll,
  className = ''
}: FilterChipsProps) {
  if (chips.length === 0) return null

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">
            Active Filters ({chips.length})
          </h4>
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
          >
            <RotateCcw className="h-3 w-3" />
            Clear All
          </button>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const colorClass = categoryColors[chip.category as keyof typeof categoryColors] || categoryColors.default
            
            return (
              <div
                key={chip.id}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-full transition-all hover:shadow-sm ${colorClass}`}
              >
                <span className="truncate max-w-32">
                  {chip.label}: {chip.value}
                </span>
                <button
                  onClick={chip.onRemove}
                  className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 transition-colors"
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Showing results filtered by {chips.length} criteria. 
            <button
              onClick={onClearAll}
              className="ml-1 text-teal-600 hover:text-teal-700 underline"
            >
              Reset to see all listings
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}