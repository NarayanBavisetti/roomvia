'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ProgressChartItem {
  label: string
  value: number
  maxValue?: number
  color?: string
  subtitle?: string
}

interface ProgressChartProps {
  title: string
  data: ProgressChartItem[]
  className?: string
}

export function ProgressChart({ title, data, className = "" }: ProgressChartProps) {
  const globalMaxValue = Math.max(...data.map(item => item.maxValue || item.value))

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
        <div className="space-y-6">
          {data.map((item, index) => {
            const maxVal = item.maxValue || globalMaxValue
            const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0
            
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    {item.subtitle && (
                      <p className="text-xs text-gray-500">{item.subtitle}</p>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-700">
                    {item.value.toLocaleString()}
                    {item.maxValue && (
                      <span className="text-gray-400 ml-1">/ {item.maxValue.toLocaleString()}</span>
                    )}
                  </p>
                </div>
                
                <div className="relative">
                  <Progress 
                    value={percentage} 
                    className="h-3"
                  />
                  <div 
                    className={`absolute top-0 left-0 h-3 rounded transition-all duration-500 ${
                      item.color || colors[index % colors.length]
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{Math.round(percentage)}%</span>
                  <span>{maxVal.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}