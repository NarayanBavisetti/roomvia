'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GridStatsItem {
  label: string
  value: number
  percentage?: number
  color?: string
  subtitle?: string
}

interface GridStatsProps {
  title: string
  data: GridStatsItem[]
  columns?: 2 | 3 | 4
  className?: string
}

export function GridStats({ 
  title, 
  data, 
  columns = 4,
  className = ""
}: GridStatsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3', 
    4: 'grid-cols-2 md:grid-cols-4'
  }

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500', 
    'bg-yellow-500',
    'bg-pink-500',
    'bg-indigo-500'
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-4 ${gridCols[columns]}`}>
          {data.map((item, index) => (
            <div 
              key={item.label}
              className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                item.color || colors[index % colors.length]
              }`} />
              
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {item.value.toLocaleString()}
              </div>
              
              <div className="text-sm font-medium text-gray-700 mb-1">
                {item.label}
              </div>
              
              {item.percentage !== undefined && (
                <div className="text-xs text-gray-500">
                  {item.percentage}% of total
                </div>
              )}
              
              {item.subtitle && (
                <div className="text-xs text-gray-400 mt-1">
                  {item.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}