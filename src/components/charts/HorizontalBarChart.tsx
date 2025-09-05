'use client'

import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HorizontalBarChartProps {
  title: string
  data: Array<{
    label: string
    value: number
    percentage?: number
    color?: string
  }>
  maxItems?: number
  showPercentage?: boolean
  className?: string
}

export function HorizontalBarChart({ 
  title, 
  data, 
  maxItems = 10, 
  showPercentage = true,
  className = ""
}: HorizontalBarChartProps) {
  const displayData = data.slice(0, maxItems)
  const maxValue = Math.max(...displayData.map(item => item.value))

  const colors = [
    'bg-blue-500',
    'bg-green-500', 
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-gray-500'
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayData.map((item, index) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-900 truncate flex-1 pr-4">
                  {item.label}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-600">{item.value.toLocaleString()}</span>
                  {showPercentage && item.percentage && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.percentage}%
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    item.color || colors[index % colors.length]
                  }`}
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%` 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {data.length > maxItems && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing top {maxItems} of {data.length} items
          </div>
        )}
      </CardContent>
    </Card>
  )
}