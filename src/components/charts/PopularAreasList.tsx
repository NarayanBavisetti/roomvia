'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

interface AreaItem {
  area: string
  search_count: number
  percentage?: number
}

interface PopularAreasListProps {
  title: string
  data: AreaItem[]
  maxItems?: number
  showPercentage?: boolean
  className?: string
}

export function PopularAreasList({ 
  title, 
  data, 
  maxItems = 10,
  showPercentage = true,
  className = ""
}: PopularAreasListProps) {
  const displayData = data.slice(0, maxItems)
  const totalSearches = data.reduce((sum, item) => sum + item.search_count, 0)

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gold-100 text-gold-600 border-gold-200'
    if (index === 1) return 'bg-silver-100 text-gray-700 border-gray-300'  
    if (index === 2) return 'bg-bronze-100 text-orange-600 border-orange-200'
    return 'bg-blue-100 text-blue-600 border-blue-200'
  }

  const getRankIcon = (index: number) => {
    if (index < 3) {
      return ['🥇', '🥈', '🥉'][index]
    }
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayData.map((item, index) => {
            const percentage = totalSearches > 0 ? Math.round((item.search_count / totalSearches) * 100) : 0
            const rankIcon = getRankIcon(index)
            
            return (
              <div 
                key={item.area}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    {rankIcon ? (
                      <span className="text-xl">{rankIcon}</span>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(index)}`}>
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {item.area}
                    </h3>
                    {showPercentage && (
                      <p className="text-xs text-gray-500 mt-1">
                        {percentage}% of total searches
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {item.search_count.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    searches
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {data.length > maxItems && (
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500 bg-gray-100 rounded-lg p-3 border border-gray-200">
              <MapPin className="h-4 w-4 inline mr-1" />
              Showing top {maxItems} of {data.length} areas
              <div className="text-xs mt-1">
                Remaining {data.length - maxItems} areas account for{' '}
                {data.slice(maxItems).reduce((sum, item) => sum + item.search_count, 0).toLocaleString()} searches
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}