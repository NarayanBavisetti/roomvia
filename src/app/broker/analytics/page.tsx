'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageCircle, 
  Bookmark, 
  Phone, 
  Calendar,
  MapPin,
  Crown,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react'
import { fetchAnalytics, type MarketData, type BrokerPerformance, formatBudget, calculateEngagementRate } from '@/lib/analytics-extraction'
import { showToast } from '@/lib/toast'

const CITIES = [
  'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
]

const TIME_PERIODS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 3 months' }
]

export default function BrokerAnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('Bangalore')
  const [selectedPeriod, setSelectedPeriod] = useState(7)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [performanceData, setPerformanceData] = useState<BrokerPerformance | null>(null)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingMarket, setLoadingMarket] = useState(false)
  const [loadingPerformance, setLoadingPerformance] = useState(false)
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
          showToast('Broker account required for analytics', { variant: 'warning' })
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
    if (!selectedCity) return
    
    setLoadingMarket(true)
    try {
      const response = await fetchAnalytics({
        city: selectedCity,
        days: selectedPeriod,
        type: 'market'
      })

      if (response) {
        setMarketData(response.data as MarketData)
        setAiSummary(response.ai_summary || '')
      } else {
        showToast('Failed to load market insights', { variant: 'error' })
      }
    } catch (error) {
      console.error('Error loading market insights:', error)
      showToast('Failed to load market insights', { variant: 'error' })
    } finally {
      setLoadingMarket(false)
    }
  }, [selectedCity, selectedPeriod])

  // Load performance data
  const loadPerformanceData = useCallback(async () => {
    setLoadingPerformance(true)
    try {
      const response = await fetchAnalytics({
        days: selectedPeriod,
        type: 'performance'
      })

      if (response) {
        setPerformanceData(response.data as BrokerPerformance)
      } else {
        showToast('Failed to load performance data', { variant: 'error' })
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
      showToast('Failed to load performance data', { variant: 'error' })
    } finally {
      setLoadingPerformance(false)
    }
  }, [selectedPeriod])

  // Initial load
  useEffect(() => {
    if (isBroker) {
      loadMarketInsights()
      loadPerformanceData()
    }
  }, [isBroker, selectedCity, selectedPeriod, loadMarketInsights, loadPerformanceData])

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
                <Crown className="h-8 w-8 text-yellow-500" />
                Broker Analytics
              </h1>
              <p className="text-gray-600 mt-2">AI-powered insights for your real estate business</p>
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
                  <Calendar className="h-4 w-4 mr-2" />
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
                onClick={() => {
                  loadMarketInsights()
                  loadPerformanceData()
                }}
                disabled={loadingMarket || loadingPerformance}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(loadingMarket || loadingPerformance) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="market" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Insights
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              My Performance
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              AI Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Market Insights Tab */}
          <TabsContent value="market" className="space-y-6">
            {loadingMarket ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">Loading market insights...</span>
              </div>
            ) : marketData ? (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Searches</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {marketData.property_demand.reduce((sum, item) => sum + item.search_count, 0)}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Budget</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatBudget(marketData.property_demand.reduce((sum, item) => sum + (item.avg_budget || 0), 0) / Math.max(marketData.property_demand.length, 1))}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Top Property</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {marketData.property_demand.sort((a, b) => b.search_count - a.search_count)[0]?.property_type || 'N/A'}
                          </p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Gated Demand</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.round((marketData.property_demand.reduce((sum, item) => sum + item.gated_preference, 0) / Math.max(marketData.property_demand.reduce((sum, item) => sum + item.search_count, 0), 1)) * 100)}%
                          </p>
                        </div>
                        <MapPin className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Property Demand Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Type Demand in {selectedCity}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketData.property_demand.map((item, index) => (
                        <div key={item.property_type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                              <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{item.property_type}</h3>
                              <p className="text-sm text-gray-600">{item.search_count} searches</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatBudget(item.avg_budget || 0)}</p>
                            <p className="text-sm text-gray-600">avg budget</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most Applied Filters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {marketData.top_filters.map((filter, index) => (
                        <Badge key={filter.filter_key} variant="secondary" className="text-sm px-3 py-2">
                          #{index + 1} {filter.filter_key} ({filter.usage_count} uses)
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No market data available</h3>
                  <p className="text-gray-600">Select a city and time period to view insights</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {loadingPerformance ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">Loading your performance...</span>
              </div>
            ) : performanceData ? (
              <>
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Listings</p>
                          <p className="text-2xl font-bold text-gray-900">{performanceData.summary.total_listings}</p>
                        </div>
                        <Eye className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Views</p>
                          <p className="text-2xl font-bold text-gray-900">{performanceData.summary.total_views}</p>
                        </div>
                        <Eye className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Messages</p>
                          <p className="text-2xl font-bold text-gray-900">{performanceData.summary.total_messages}</p>
                        </div>
                        <MessageCircle className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Avg Views/Post</p>
                          <p className="text-2xl font-bold text-gray-900">{Math.round(performanceData.summary.avg_views_per_post || 0)}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Individual Post Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Your Listings Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceData.posts.map((post) => (
                        <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{post.title}</h3>
                              <p className="text-sm text-gray-600">{post.property_type} • {post.city} • {formatBudget(post.rent)}/month</p>
                            </div>
                            <Badge variant="outline" className={`${calculateEngagementRate(post) > 10 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                              {calculateEngagementRate(post).toFixed(1)}% engagement
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Eye className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">{post.views}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Bookmark className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium">{post.saves}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <MessageCircle className="h-4 w-4 text-purple-500" />
                              <span className="text-sm font-medium">{post.messages}</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <Phone className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium">{post.phone_reveals}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No performance data</h3>
                  <p className="text-gray-600">Create some listings to see performance analytics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  AI-Powered Recommendations for {selectedCity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMarket ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    <span className="ml-3 text-gray-600">Generating AI insights...</span>
                  </div>
                ) : aiSummary ? (
                  <div className="prose prose-gray max-w-none">
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                        {aiSummary}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI insights available</h3>
                    <p className="text-gray-600">Load market data to generate AI recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF (Coming Soon)
                  </Button>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}