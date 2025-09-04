'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AmenityItem {
  amenity: string
  usage_count: number
  rank?: number
}

interface AmenitiesListProps {
  title: string
  data: AmenityItem[]
  maxItems?: number
  showRank?: boolean
  variant?: 'badges' | 'list'
  className?: string
}

export function AmenitiesList({ 
  title, 
  data, 
  maxItems = 10,
  showRank = true,
  variant = 'badges',
  className = ""
}: AmenitiesListProps) {
  const displayData = data.slice(0, maxItems)

  const getBadgeVariant = (index: number): "default" | "secondary" | "outline" => {
    if (index === 0) return "default"
    if (index < 3) return "secondary"
    return "outline"
  }

  const getBadgeColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200', 
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200'
    ]
    return colors[index % colors.length]
  }

  if (variant === 'badges') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {displayData.map((item, index) => (
              <Badge 
                key={item.amenity} 
                variant={getBadgeVariant(index)}
                className={`text-sm px-3 py-2 ${getBadgeColor(index)}`}
              >
                {showRank && (
                  <span className="font-bold mr-1">#{index + 1}</span>
                )}
                {item.amenity}
                <span className="ml-2 text-xs opacity-75">
                  ({item.usage_count})
                </span>
              </Badge>
            ))}
          </div>
          
          {data.length > maxItems && (
            <div className="mt-4 text-center">
              <Badge variant="outline" className="text-xs">
                +{data.length - maxItems} more
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((item, index) => (
            <div 
              key={item.amenity} 
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {showRank && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                )}
                <span className="font-medium text-gray-900 capitalize">
                  {item.amenity.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-700">
                  {item.usage_count.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  searches
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {data.length > maxItems && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing top {maxItems} of {data.length} amenities
          </div>
        )}
      </CardContent>
    </Card>
  )
}