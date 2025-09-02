'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'

interface PriceRangeSliderProps {
  min: number
  max: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  step?: number
  formatValue?: (value: number) => string
  className?: string
}

export default function PriceRangeSlider({
  min = 0,
  max = 100,
  value,
  onChange,
  step = 1,
  formatValue = (val) => `₹${val.toLocaleString()}`,
  className = ''
}: PriceRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const [localValue, setLocalValue] = useState(value)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const getPercentage = useCallback((val: number) => {
    return ((val - min) / (max - min)) * 100
  }, [min, max])

  const getValueFromPosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return min
    
    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const rawValue = min + (max - min) * percentage
    return Math.round(rawValue / step) * step
  }, [min, max, step])

  const handleMouseDown = useCallback((thumb: 'min' | 'max') => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(thumb)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !sliderRef.current) return
    
    const newValue = getValueFromPosition(e.clientX)
    const [currentMin, currentMax] = localValue
    
    let newRange: [number, number]
    
    if (isDragging === 'min') {
      newRange = [Math.min(newValue, currentMax - step), currentMax]
    } else {
      newRange = [currentMin, Math.max(newValue, currentMin + step)]
    }
    
    setLocalValue(newRange)
    onChange(newRange)
  }, [isDragging, localValue, getValueFromPosition, step, onChange])

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

  const handleInputChange = useCallback((type: 'min' | 'max', inputValue: string) => {
    const numValue = parseInt(inputValue.replace(/[^0-9]/g, '')) || 0
    const [currentMin, currentMax] = localValue
    
    let newRange: [number, number]
    
    if (type === 'min') {
      newRange = [Math.max(min, Math.min(numValue, currentMax - step)), currentMax]
    } else {
      newRange = [currentMin, Math.min(max, Math.max(numValue, currentMin + step))]
    }
    
    setLocalValue(newRange)
    onChange(newRange)
  }, [localValue, min, max, step, onChange])

  const minPercent = getPercentage(localValue[0])
  const maxPercent = getPercentage(localValue[1])

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input Fields */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Min Price</label>
          <input
            type="text"
            value={formatValue(localValue[0])}
            onChange={(e) => handleInputChange('min', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder={formatValue(min)}
          />
        </div>
        <div className="pt-6 text-gray-400">-</div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Max Price</label>
          <input
            type="text"
            value={formatValue(localValue[1])}
            onChange={(e) => handleInputChange('max', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            placeholder={formatValue(max)}
          />
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <div
          ref={sliderRef}
          className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        >
          {/* Active Range */}
          <div
            className="absolute h-2 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`
            }}
          />
          
          {/* Min Thumb */}
          <div
            className={`absolute w-5 h-5 bg-white border-2 border-teal-500 rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-all ${
              isDragging === 'min' ? 'scale-110 shadow-lg cursor-grabbing' : 'hover:scale-110'
            }`}
            style={{
              left: `${minPercent}%`,
              top: '50%'
            }}
            onMouseDown={handleMouseDown('min')}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {formatValue(localValue[0])}
            </div>
          </div>
          
          {/* Max Thumb */}
          <div
            className={`absolute w-5 h-5 bg-white border-2 border-teal-500 rounded-full cursor-grab transform -translate-x-1/2 -translate-y-1/2 transition-all ${
              isDragging === 'max' ? 'scale-110 shadow-lg cursor-grabbing' : 'hover:scale-110'
            }`}
            style={{
              left: `${maxPercent}%`,
              top: '50%'
            }}
            onMouseDown={handleMouseDown('max')}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {formatValue(localValue[1])}
            </div>
          </div>
        </div>
        
        {/* Value Display */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{formatValue(min)}</span>
          <span className="font-medium text-teal-600">
            {formatValue(localValue[0])} - {formatValue(localValue[1])}
          </span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  )
}