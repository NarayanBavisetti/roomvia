'use client'

import React from 'react'
import { ChevronDown, X } from 'lucide-react'

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  isCollapsible?: boolean
  isExpanded?: boolean
  onToggle?: () => void
  activeCount?: number
  onClear?: () => void
  className?: string
}

export default function FilterSection({
  title,
  children,
  isCollapsible = false,
  isExpanded = true,
  onToggle,
  activeCount = 0,
  onClear,
  className = ''
}: FilterSectionProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-white bg-teal-500 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeCount > 0 && onClear && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
          
          {isCollapsible && (
            <button
              onClick={onToggle}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
            >
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
          )}
        </div>
      </div>
      
      {/* Content */}
      {(!isCollapsible || isExpanded) && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  )
}