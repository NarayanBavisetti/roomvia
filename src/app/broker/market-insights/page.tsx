'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MapPin,
  Crown,
  Loader2,
  Download,
  RefreshCw,
  Eye,
  Building,
  Target
} from 'lucide-react'

import { MetricCard } from '@/components/charts/MetricCard'
import { HorizontalBarChart } from '@/components/charts/HorizontalBarChart'
import { GridStats } from '@/components/charts/GridStats'
import { AmenitiesList } from '@/components/charts/AmenitiesList'
import { PopularAreasList } from '@/components/charts/PopularAreasList'
import { showToast } from '@/lib/toast'
import { exportToCSV, exportToPDF, exportToJSON } from '@/lib/export-utils'

const CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
]

const TIME_PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 3 months' }
]

interface MarketInsightsData {
  totalSearches: number
  uniqueUsers: number
  topProperty: string
  topLocation: string
  propertyTypeDemand: Array<{
    property_type: string
    search_count: number
    percentage: number
  }>
  amenitiesRanking: Array<{
    amenity: string
    usage_count: number
  }>
  budgetDistribution: {
    '< ₹15k': number
    '₹15k-25k': number
    '₹25k-40k': number
    '> ₹40k': number
  }
  popularAreas: Array<{
    area: string
    search_count: number
  }>
  demographics: {
    malePercentage: number
    femalePercentage: number
    brokerPreference: number
    noBrokerPreference: number
  }
  occupancyPreferences: Array<{
    occupancy: string
    count: number
  }>
  lifestylePreferences: Array<{
    lifestyle: string
    count: number
  }>
}

interface MarketInsightsResponse {
  success: boolean
  data: MarketInsightsData
  aiInsights: string
  actionableRecommendations: string[]
  confidence: number
  metadata: {
    city: string
    timePeriod: string
    totalFilterRecords: number
    analysisDate: string
    fallbackUsed: boolean
  }
}

export default function MarketInsightsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('Bangalore')
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [marketData, setMarketData] = useState<MarketInsightsResponse | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [isBroker, setIsBroker] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)

  // Check broker access
  useEffect(() => {
    const checkBrokerAccess = async () => {
      if (!user) return
      
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single()

        if (profile?.account_type === 'broker') {
          setIsBroker(true)
        } else {
          showToast('Broker account required for market insights', { variant: 'warning' })
          router.push('/profile')
        }
      } catch (error) {
        console.error('Error checking broker access:', error)
        router.push('/profile')
      } finally {
        setCheckingAccess(false)
      }
    }

    if (!loading && user) {
      checkBrokerAccess()
    } else if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // Load market insights
  const loadMarketInsights = useCallback(async () => {
    if (!selectedCity || !user) return
    
    setLoadingData(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(
        `/api/market-insights/${encodeURIComponent(selectedCity)}?days=${selectedPeriod}&period=Last ${selectedPeriod} days`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          credentials: 'include',
        }
      )
      
      const data = await response.json()

      if (response.ok && data.success) {
        setMarketData(data)
      } else {
        console.error('Failed to load market insights:', data.error)
        showToast(data.error || 'Failed to load market insights', { variant: 'error' })
      }
    } catch (error) {
      console.error('Error loading market insights:', error)
      showToast('Failed to load market insights', { variant: 'error' })
    } finally {
      setLoadingData(false)
    }
  }, [selectedCity, selectedPeriod, user])

  // Initial load
  useEffect(() => {
    if (isBroker) {
      loadMarketInsights()
    }
  }, [isBroker, selectedCity, selectedPeriod, loadMarketInsights])

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </div>
    )
  }

  if (!isBroker) {
    return null // Redirecting to profile
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Target className="h-8 w-8 text-purple-500" />
                Market Insights Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive real estate market analysis for strategic decision making</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-48">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod.toString()} onValueChange={(v) => setSelectedPeriod(parseInt(v))}>
                <SelectTrigger className="w-40">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_PERIODS.map(period => (
                    <SelectItem key={period.value} value={period.value.toString()}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={loadMarketInsights}
                disabled={loadingData}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {loadingData ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Loading market insights for {selectedCity}...</p>
              <p className="text-gray-500 text-sm">Analyzing {selectedPeriod} days of search data</p>
            </div>
          </div>
        ) : marketData ? (
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="demand" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Demand Analysis
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Intelligence
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Searches"
                  value={marketData.data.totalSearches}
                  icon={Eye}
                  color="blue"
                  subtitle="Search volume in period"
                />
                <MetricCard
                  title="Unique Users"
                  value={marketData.data.uniqueUsers}
                  icon={Users}
                  color="green"
                  subtitle="Active market participants"
                />
                <MetricCard
                  title="Top Property Type"
                  value={marketData.data.topProperty}
                  icon={Building}
                  color="purple"
                  subtitle="Most demanded category"
                />
                <MetricCard
                  title="Top Location"
                  value={marketData.data.topLocation}
                  icon={MapPin}
                  color="orange"
                  subtitle="Highest search area"
                />
              </div>

              {/* Budget Distribution */}
              <GridStats
                title="Budget Range Distribution"
                data={Object.entries(marketData.data.budgetDistribution).map(([range, count]) => ({
                  label: range,
                  value: count,
                  percentage: marketData.data.totalSearches > 0 
                    ? Math.round((count / marketData.data.totalSearches) * 100) 
                    : 0
                }))}
                columns={4}
              />

              {/* Demographics Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Demographics & Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {marketData.data.demographics.malePercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Male Preference</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">
                        {marketData.data.demographics.femalePercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Female Preference</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {marketData.data.demographics.brokerPreference}%
                      </div>
                      <div className="text-sm text-gray-600">Want Broker</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {marketData.data.demographics.noBrokerPreference}%
                      </div>
                      <div className="text-sm text-gray-600">No Broker</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demand Analysis Tab */}
            <TabsContent value="demand" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Property Type Demand */}
                <HorizontalBarChart
                  title="Property Type Demand"
                  data={marketData.data.propertyTypeDemand.map(item => ({
                    label: item.property_type,
                    value: item.search_count,
                    percentage: item.percentage
                  }))}
                  maxItems={8}
                  showPercentage={true}
                />

                {/* Occupancy Preferences */}
                <HorizontalBarChart
                  title="Occupancy Preferences"
                  data={marketData.data.occupancyPreferences.map(item => ({
                    label: item.occupancy,
                    value: item.count
                  }))}
                  maxItems={6}
                  showPercentage={false}
                />
              </div>

              {/* Amenities Analysis */}
              <AmenitiesList
                title="Most Searched Amenities"
                data={marketData.data.amenitiesRanking}
                maxItems={10}
                variant="list"
              />

              {/* Lifestyle Preferences */}
              {marketData.data.lifestylePreferences.length > 0 && (
                <GridStats
                  title="Lifestyle & Food Preferences"
                  data={marketData.data.lifestylePreferences.slice(0, 8).map(item => ({
                    label: item.lifestyle,
                    value: item.count
                  }))}
                  columns={4}
                />
              )}
            </TabsContent>

            {/* Location Intelligence Tab */}
            <TabsContent value="locations" className="space-y-8">
              <PopularAreasList
                title={`Popular Areas in ${selectedCity}`}
                data={marketData.data.popularAreas}
                maxItems={15}
                showPercentage={true}
              />

              {/* Location-Based Insights Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Market Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {marketData.data.popularAreas.length}
                        </div>
                        <div className="text-sm text-gray-600">Active Areas</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {marketData.data.popularAreas.slice(0, 5).reduce((sum, area) => sum + area.search_count, 0)}
                        </div>
                        <div className="text-sm text-gray-600">Top 5 Areas Searches</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {marketData.data.popularAreas.length > 0 
                            ? Math.round(marketData.data.popularAreas[0].search_count / marketData.data.totalSearches * 100) 
                            : 0}%
                        </div>
                        <div className="text-sm text-gray-600">Top Area Market Share</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="insights" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-purple-500" />
                    {marketData.metadata.fallbackUsed ? 'Statistical Market Analysis' : 'AI-Powered Market Intelligence'}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Confidence: {Math.round(marketData.confidence * 100)}%</span>
                    <span>•</span>
                    <span>{marketData.metadata.totalFilterRecords} data points</span>
                    <span>•</span>
                    <span>{marketData.metadata.timePeriod}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {marketData.aiInsights}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actionable Recommendations */}
              {marketData.actionableRecommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Actionable Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketData.actionableRecommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div className="text-gray-800 leading-relaxed">{recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Market Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          await exportToPDF(marketData)
                          showToast('PDF report downloaded successfully', { variant: 'success' })
                        } catch (error) {
                          console.error('Export error:', error)
                          showToast('Failed to export PDF report', { variant: 'error' })
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download HTML Report
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        try {
                          exportToCSV(marketData)
                          showToast('CSV data exported successfully', { variant: 'success' })
                        } catch (error) {
                          console.error('Export error:', error)
                          showToast('Failed to export CSV data', { variant: 'error' })
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV Data
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        try {
                          exportToJSON(marketData)
                          showToast('JSON data exported successfully', { variant: 'success' })
                        } catch (error) {
                          console.error('Export error:', error)
                          showToast('Failed to export JSON data', { variant: 'error' })
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export JSON
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Export comprehensive market reports in multiple formats for further analysis and presentations.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="p-20 text-center">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">No Market Data Available</h3>
              <p className="text-gray-600 mb-6">
                No search activity found for {selectedCity} in the last {selectedPeriod} days.
              </p>
              <Button onClick={loadMarketInsights} disabled={loadingData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Different City or Period
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}