import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Color palette for charts
const COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5A2B', // Brown
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#6B7280'  // Gray
]

interface PropertyTypeChartProps {
  data: Array<{ property_type: string; search_count: number }>
}

export function PropertyTypeChart({ data }: PropertyTypeChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.property_type,
    value: item.search_count,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${value} (${((percent || 0) * 100).toFixed(1)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

interface PriceRangeChartProps {
  data: Record<string, number>
}

export function PriceRangeChart({ data }: PriceRangeChartProps) {
  const chartData = Object.entries(data).map(([range, count]) => ({
    range,
    count
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="range"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis />
          <Tooltip
            formatter={(value) => [value, 'Searches']}
            labelStyle={{ color: '#374151' }}
          />
          <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface LocationChartProps {
  data: Array<{ area: string; search_count: number }>
}

export function LocationChart({ data }: LocationChartProps) {
  console.log('LocationChart received data:', data) // Temporary debug

  const topLocations = data.slice(0, 6) // Show top 6 locations
  const chartData = topLocations.map((item) => ({
    name: item.area,
    searches: item.search_count
  }))

  console.log('LocationChart chartData:', chartData) // Temporary debug

  // Show message if no data
  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">No location data available</div>
          <div className="text-sm">Location preferences will appear when users search for properties</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
            interval={0}
          />
          <YAxis />
          <Tooltip
            formatter={(value) => [value, 'Searches']}
            labelStyle={{ color: '#374151' }}
          />
          <Bar dataKey="searches" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface AmenitiesChartProps {
  data: Array<{ amenity: string; usage_count: number }>
}

export function AmenitiesChart({ data }: AmenitiesChartProps) {
  const topAmenities = data.slice(0, 8) // Show top 8 amenities
  const chartData = topAmenities.map((item, index) => ({
    name: item.amenity,
    count: item.usage_count,
    fill: COLORS[index % COLORS.length]
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            label={({ name, percent }) => (percent || 0) > 5 ? `${name} (${((percent || 0) * 100).toFixed(0)}%)` : ''}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [value, 'Searches']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Improved amenity display component (no hashtags)
interface AmenityTagsProps {
  amenities: Array<{ amenity: string; usage_count: number }>
  maxDisplay?: number
}

export function AmenityTags({ amenities, maxDisplay = 10 }: AmenityTagsProps) {
  const displayAmenities = amenities.slice(0, maxDisplay)

  return (
    <div className="flex flex-wrap gap-2">
      {displayAmenities.map((amenity, index) => (
        <div
          key={amenity.amenity}
          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800 hover:shadow-sm transition-shadow"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: COLORS[index % COLORS.length] }}
          />
          <span>{amenity.amenity}</span>
          <span className="text-xs bg-white px-1.5 py-0.5 rounded-full text-gray-600 font-normal">
            {amenity.usage_count}
          </span>
        </div>
      ))}
    </div>
  )
}