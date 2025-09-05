'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, 
  MapPin,
  Home,
  Users,
  IndianRupee,
  Wifi,
  BarChart3,
  Loader2,
  Building2,
  UserCheck,
  Sparkles,
  ChevronDown
} from 'lucide-react'
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
  ResponsiveContainer
} from 'recharts'

interface MarketInsights {
  cityStats: {
    totalListings: number
    avgRent: number
    mostExpensiveArea: string
    mostAffordableArea: string
  }
  areaComparison: Array<{
    area: string
    avgRent: number
    listingCount: number
    avgPerSqft: number
  }>
  bhkDistribution: Array<{
    bhk: string
    count: number
    avgPrice: number
    area?: string
  }>
  genderPreferences: {
    femaleAreas: Array<{ area: string; percentage: number }>
    maleAreas: Array<{ area: string; percentage: number }>
    coeducationalAreas: Array<{ area: string; percentage: number }>
  }
  topAmenities: Array<{
    amenity: string
    count: number
    avgRentWithAmenity: number
  }>
  flatmatePreferences: {
    foodPreferences: Array<{ type: string; count: number }>
    smokingPreferences: Array<{ type: string; count: number }>
    petPreferences: Array<{ type: string; count: number }>
  }
  priceRanges: Array<{
    range: string
    count: number
    percentage: number
  }>
  aiSummary: string
}

const COLORS = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
  '#EF4444', '#8B5A2B', '#6366F1', '#EC4899',
  '#84CC16', '#6B7280'
]

const CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
]

export default function MarketInsightsPage() {
  const [selectedCity, setSelectedCity] = useState<string>('Hyderabad')
  const [insights, setInsights] = useState<MarketInsights | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAiAnalysisOpen, setIsAiAnalysisOpen] = useState(false)


  useEffect(() => {
    const fetchMarketInsights = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Fetch listings data for the selected city
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select('*')
          .eq('city', selectedCity)
          .eq('status', 'active')

        if (listingsError) {
          throw new Error('Failed to fetch listings data')
        }

        // Fetch flatmates data for demographic insights
        const { data: flatmates, error: flatmatesError } = await supabase
          .from('flatmates')
          .select('*')
          .eq('city', selectedCity)

        if (flatmatesError) {
          console.warn('Failed to fetch flatmates data:', flatmatesError)
        }

        // Process listings data
        const processedInsights = await processMarketData(listings || [], flatmates || [])
        setInsights(processedInsights)

      } catch (err) {
        console.error('Error fetching market insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load market insights')
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedCity) {
      fetchMarketInsights()
    }
  }, [selectedCity])

  const processMarketData = async (listings: any[], flatmates: any[]): Promise<MarketInsights> => {
    // City Stats
    const totalListings = listings.length
    const avgRent = listings.length > 0 ? Math.round(listings.reduce((acc, l) => acc + (l.rent || 0), 0) / listings.length) : 0
    
    // Area-wise analysis
    const areaStats: Record<string, { rents: number[], count: number, totalSqft: number }> = {}
    listings.forEach(listing => {
      const area = listing.area || 'Others'
      if (!areaStats[area]) {
        areaStats[area] = { rents: [], count: 0, totalSqft: 0 }
      }
      areaStats[area].rents.push(listing.rent || 0)
      areaStats[area].count++
      areaStats[area].totalSqft += listing.area_sqft || 1000
    })

    const areaComparison = Object.entries(areaStats)
      .map(([area, stats]) => ({
        area,
        avgRent: Math.round(stats.rents.reduce((a, b) => a + b, 0) / stats.rents.length),
        listingCount: stats.count,
        avgPerSqft: Math.round((stats.rents.reduce((a, b) => a + b, 0) / stats.rents.length) / (stats.totalSqft / stats.count))
      }))
      .sort((a, b) => b.avgRent - a.avgRent)
      .slice(0, 8)

    const mostExpensiveArea = areaComparison[0]?.area || 'N/A'
    const mostAffordableArea = areaComparison[areaComparison.length - 1]?.area || 'N/A'

    // BHK Distribution
    const bhkStats: Record<string, { count: number, rents: number[] }> = {}
    listings.forEach(listing => {
      const bhk = listing.property_type || 'Other'
      if (!bhkStats[bhk]) {
        bhkStats[bhk] = { count: 0, rents: [] }
      }
      bhkStats[bhk].count++
      bhkStats[bhk].rents.push(listing.rent || 0)
    })

    const bhkDistribution = Object.entries(bhkStats)
      .map(([bhk, stats]) => ({
        bhk,
        count: stats.count,
        avgPrice: Math.round(stats.rents.reduce((a, b) => a + b, 0) / stats.rents.length)
      }))
      .sort((a, b) => b.count - a.count)

    // Amenities Analysis
    const amenityStats: Record<string, { count: number, rents: number[] }> = {}
    listings.forEach(listing => {
      if (listing.highlights && Array.isArray(listing.highlights)) {
        listing.highlights.forEach((amenity: string) => {
          if (!amenityStats[amenity]) {
            amenityStats[amenity] = { count: 0, rents: [] }
          }
          amenityStats[amenity].count++
          amenityStats[amenity].rents.push(listing.rent || 0)
        })
      }
    })

    const topAmenities = Object.entries(amenityStats)
      .map(([amenity, stats]) => ({
        amenity,
        count: stats.count,
        avgRentWithAmenity: Math.round(stats.rents.reduce((a, b) => a + b, 0) / stats.rents.length)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Price Ranges
    const priceRanges = [
      { range: '₹5k-15k', min: 5000, max: 15000 },
      { range: '₹15k-25k', min: 15000, max: 25000 },
      { range: '₹25k-35k', min: 25000, max: 35000 },
      { range: '₹35k-50k', min: 35000, max: 50000 },
      { range: '₹50k+', min: 50000, max: Infinity }
    ]

    const priceDistribution = priceRanges.map(range => {
      const count = listings.filter(l => l.rent >= range.min && l.rent < range.max).length
      return {
        range: range.range,
        count,
        percentage: totalListings > 0 ? Math.round((count / totalListings) * 100) : 0
      }
    })

    // Gender Preferences Analysis from flatmates
    const genderAreas: Record<string, { male: number, female: number, any: number }> = {}
    flatmates.forEach(flatmate => {
      const preferredAreas = flatmate.preferred_locations || []
      const gender = flatmate.flatmate_preferences?.gender || 'Any'
      
      preferredAreas.forEach((area: string) => {
        if (!genderAreas[area]) {
          genderAreas[area] = { male: 0, female: 0, any: 0 }
        }
        if (gender === 'Male') genderAreas[area].male++
        else if (gender === 'Female') genderAreas[area].female++
        else genderAreas[area].any++
      })
    })

    const femaleAreas = Object.entries(genderAreas)
      .map(([area, stats]) => ({
        area,
        percentage: Math.round((stats.female / (stats.male + stats.female + stats.any)) * 100) || 0
      }))
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)

    const maleAreas = Object.entries(genderAreas)
      .map(([area, stats]) => ({
        area,
        percentage: Math.round((stats.male / (stats.male + stats.female + stats.any)) * 100) || 0
      }))
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)

    const coeducationalAreas = Object.entries(genderAreas)
      .map(([area, stats]) => ({
        area,
        percentage: Math.round((stats.any / (stats.male + stats.female + stats.any)) * 100) || 0
      }))
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)

    // Flatmate Preferences
    const foodPrefs: Record<string, number> = {}
    const smokingPrefs: Record<string, number> = {}
    const petPrefs: Record<string, number> = {}

    flatmates.forEach(flatmate => {
      const food = flatmate.food_preference || 'Any'
      const smoking = flatmate.non_smoker ? 'Non-smoker' : 'Smoker allowed'
      const pets = 'Pets: ' + (flatmate.flatmate_preferences?.pets ? 'Allowed' : 'Not allowed')
      
      foodPrefs[food] = (foodPrefs[food] || 0) + 1
      smokingPrefs[smoking] = (smokingPrefs[smoking] || 0) + 1
      petPrefs[pets] = (petPrefs[pets] || 0) + 1
    })

    // Generate AI Summary
    const aiSummary = await generateAISummary({
      city: selectedCity,
      totalListings,
      avgRent,
      mostExpensiveArea,
      mostAffordableArea,
      topBHK: bhkDistribution[0]?.bhk || 'N/A',
      topAmenities: topAmenities.slice(0, 3).map(a => a.amenity)
    })

    return {
      cityStats: { totalListings, avgRent, mostExpensiveArea, mostAffordableArea },
      areaComparison,
      bhkDistribution,
      genderPreferences: { femaleAreas, maleAreas, coeducationalAreas },
      topAmenities,
      flatmatePreferences: {
        foodPreferences: Object.entries(foodPrefs).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
        smokingPreferences: Object.entries(smokingPrefs).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
        petPreferences: Object.entries(petPrefs).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
      },
      priceRanges: priceDistribution,
      aiSummary
    }
  }

  const generateAISummary = async (data: any): Promise<string> => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const response = await fetch('/api/ai/market-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          city: data.city,
          marketData: data
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate AI summary')
      }

      const result = await response.json()
      return result.summary || 'AI summary unavailable'
    } catch (error) {
      console.error('Error generating AI summary:', error)
      return `## ${data.city} Market Overview

**Quick Stats:**
• ${data.totalListings} active listings
• Average rent: ₹${data.avgRent.toLocaleString()}
• Most expensive area: ${data.mostExpensiveArea}
• Most affordable area: ${data.mostAffordableArea}
• Popular property type: ${data.topBHK}

**Top Amenities:** ${data.topAmenities.join(', ')}

*AI-powered detailed analysis temporarily unavailable. Use the charts below for comprehensive market insights.*`
    }
  }

  return (
    <div className="min-h-screen bg-white-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Market Insights</h1>
                <p className="text-gray-600">Discover rental trends, pricing, and demographics</p>
              </div>
            </div>
            
            {/* City Selector */}
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              <span className="ml-2 text-gray-600">Analyzing market data for {selectedCity}...</span>
            </div>
          </div>
        ) : error ? (
          <Card className="mb-8">
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load market insights</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : insights ? (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Listings</p>
                      <p className="text-3xl font-bold text-gray-900">{insights.cityStats.totalListings}</p>
                      <p className="text-xs text-gray-500">Properties available</p>
                    </div>
                    <Home className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Rent</p>
                      <p className="text-3xl font-bold text-gray-900">₹{insights.cityStats.avgRent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Per month</p>
                    </div>
                    <IndianRupee className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Most Expensive</p>
                      <p className="text-lg font-bold text-gray-900">{insights.cityStats.mostExpensiveArea}</p>
                      <p className="text-xs text-gray-500">Premium area</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Most Affordable</p>
                      <p className="text-lg font-bold text-gray-900">{insights.cityStats.mostAffordableArea}</p>
                      <p className="text-xs text-gray-500">Budget-friendly</p>
                    </div>
                    <MapPin className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Area Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Area-wise Average Rent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.areaComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="area" 
                          angle={-45} 
                          textAnchor="end" 
                          height={100}
                          fontSize={12}
                        />
                        <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value, name) => [`₹${value.toLocaleString()}`, 'Avg Rent']}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Bar dataKey="avgRent" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* BHK Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-green-500" />
                    Popular Property Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.bhkDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ bhk, count, percent }) => `${bhk}: ${count} (${(percent * 100).toFixed(1)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {insights.bhkDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, 'Properties']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Gender Preferences */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Female Preferred Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.genderPreferences.femaleAreas.length > 0 ? (
                    <div className="space-y-3">
                      {insights.genderPreferences.femaleAreas.map((item, index) => (
                        <div key={item.area} className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm">{item.area}</span>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-16 overflow-hidden">
                              <div 
                                className="bg-pink-500 h-full rounded-full"
                                style={{ width: `${Math.max(10, item.percentage)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-blue-500" />
                    Male Preferred Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {insights.genderPreferences.maleAreas.length > 0 ? (
                    <div className="space-y-3">
                      {insights.genderPreferences.maleAreas.map((item, index) => (
                        <div key={item.area} className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm">{item.area}</span>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-16 overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${Math.max(10, item.percentage)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Price Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-green-500" />
                    Price Ranges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {insights.priceRanges.map((range, index) => (
                      <div key={range.range} className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">{range.range}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 rounded-full h-2 w-16 overflow-hidden">
                            <div 
                              className="bg-green-500 h-full rounded-full"
                              style={{ width: `${Math.max(5, range.percentage)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{range.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Amenities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-purple-500" />
                  Most Sought-after Amenities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {insights.topAmenities.map((amenity, index) => (
                    <div key={amenity.amenity} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-xs text-gray-600">{amenity.count}</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{amenity.amenity}</p>
                      <p className="text-xs text-gray-600">₹{amenity.avgRentWithAmenity.toLocaleString()} avg</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Market Analysis - Collapsible */}
            <Collapsible 
              open={isAiAnalysisOpen} 
              onOpenChange={setIsAiAnalysisOpen}
              className="mt-8"
            >
              <CollapsibleTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-14 text-left bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">AI Market Analysis for {selectedCity}</div>
                      <div className="text-sm text-gray-600">Get detailed insights powered by AI</div>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isAiAnalysisOpen ? 'transform rotate-180' : ''
                    }`} 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardContent className="p-6">
                    <AIInsightsSections aiSummary={insights.aiSummary} city={selectedCity} />
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No market data available</h3>
              <p className="text-gray-600 mb-4">Market insights for {selectedCity} will appear here once data is available</p>
              <Button 
                onClick={() => setSelectedCity(CITIES[1] || 'Bangalore')}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Try Another City
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

// AI Insights Sections Component
interface AIInsightsSectionsProps {
  aiSummary: string
  city: string
}

function AIInsightsSections({ aiSummary, city }: AIInsightsSectionsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionKey: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  // Parse AI summary into structured sections
  const parseAISummary = (summary: string) => {
    const sections = []
    const lines = summary.split('\n')
    let currentSection: { title: string; content: string; key: string } | null = null
    
    for (const line of lines) {
      if (line.startsWith('##') || line.startsWith('###')) {
        // Save previous section
        if (currentSection) {
          sections.push(currentSection)
        }
        
        // Start new section
        const title = line.replace(/^#{2,3}\s*/, '').trim()
        const key = title.toLowerCase().replace(/[^a-z0-9]/g, '-')
        currentSection = { title, content: '', key }
      } else if (currentSection && line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line
      }
    }
    
    // Add last section
    if (currentSection) {
      sections.push(currentSection)
    }
    
    return sections
  }

  const sections = parseAISummary(aiSummary)

  // If parsing fails, show the original content
  if (sections.length === 0) {
    return (
      <div className="prose max-w-none">
        <div className="text-gray-700 whitespace-pre-line">{aiSummary}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Collapsible 
          key={section.key} 
          open={openSections[section.key] || index === 0} // First section open by default
          onOpenChange={() => toggleSection(section.key)}
        >
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between p-4 h-auto text-left hover:bg-white/50 border border-purple-100 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="font-semibold text-gray-900">{section.title}</span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform duration-200 ${
                  openSections[section.key] || (index === 0 && openSections[section.key] !== false) 
                    ? 'transform rotate-180' : ''
                }`} 
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="pl-6 pr-4 pb-4">
              <div className="prose prose-sm max-w-none">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {section.content.trim()}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}