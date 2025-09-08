'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Switch } from '@/components/ui/switch'
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MessageCircle, 
  Heart, 
  Phone, 
  Calendar,
  MapPin,
  Crown,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
  Bell
} from 'lucide-react'
import { fetchAnalytics, type BrokerPerformance, formatBudget, calculateEngagementRate } from '@/lib/analytics-extraction'
import { showToast } from '@/lib/toast'
import { useBrokerInsights, useBrokerInsightsRefresh } from '@/hooks/useBrokerInsights'

const CITIES = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'
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
  const queryClient = useQueryClient()
  const [selectedCity, setSelectedCity] = useState('Hyderabad')
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [performanceData, setPerformanceData] = useState<BrokerPerformance | null>(null)
  const [loadingPerformance, setLoadingPerformance] = useState(false)
  const [isBroker, setIsBroker] = useState(false)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  

  // Heavy AI insights only for Recommendations tab
  const {
    data: aiInsights,
    isLoading: loadingInsights,
    error: insightsError
  } = useBrokerInsights({
    city: selectedCity,
    days: selectedPeriod,
    enabled: isBroker
  })
  
  const { refresh: refreshInsights, isRefreshing } = useBrokerInsightsRefresh()

  // Type assertion for aiInsights
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typedInsights = aiInsights as any

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

  // Refresh handler for manual refresh
  const handleRefresh = async () => {
    await refreshInsights(queryClient, selectedCity, selectedPeriod)
    if (performanceData) {
      loadPerformanceData()
    }
  }

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

  // Show error messages from insights hook
  useEffect(() => {
    if (insightsError) {
      console.error('Insights error:', insightsError)
      showToast('Failed to load broker insights', { variant: 'error' })
    }
  }, [insightsError])

  // Initial load
  useEffect(() => {
    if (isBroker) {
      loadPerformanceData()
    }
  }, [isBroker, selectedPeriod, loadPerformanceData])

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
    <div className="min-h-screen bg-white-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
                <Crown className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Broker Analytics</h1>
                <p className="text-gray-600">AI-powered insights for your real estate business</p>
              </div>
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
                onClick={handleRefresh}
                disabled={isRefreshing || loadingPerformance || loadingInsights}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${(isRefreshing || loadingPerformance || loadingInsights) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              My Performance
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              AI Recommendations
            </TabsTrigger>
          </TabsList>


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
                          <p className="text-sm font-medium text-gray-600">Messages <Bell className="inline ml-1 h-4 w-4 text-yellow-500 align-text-top" /></p>
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
                              <Heart className="h-4 w-4 text-green-500" />
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
            {loadingInsights ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <span className="ml-3 text-gray-600">Generating AI insights...</span>
              </div>
            ) : typedInsights ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      {typedInsights?.fallback_used ? 'Statistical Market Analysis' : 'AI-Powered Market Analysis'} for {selectedCity}
                    </CardTitle>
                    {typedInsights?.fallback_used && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-sm text-amber-800 font-medium">
                            Statistical Analysis Mode - AI service temporarily unavailable
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                          Analysis generated using statistical insights from user search data
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                      <AIInsightsSections aiSummary={typedInsights?.ai_summary || ''} />
                    </div>
                  </CardContent>
                </Card>

                {typedInsights?.recommendations && typedInsights.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        Key Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(typedInsights?.recommendations || []).map((recommendation: string, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-sm font-bold">{index + 1}</span>
                            </div>
                            <div className="text-gray-800 leading-relaxed">{recommendation}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      Data Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Analysis Period</div>
                        <div className="text-lg font-semibold text-gray-900">{selectedPeriod} days</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Data Points</div>
                        <div className="text-lg font-semibold text-gray-900">{typedInsights?.metadata?.totalFilters || 0} filter records</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Analysis Type</div>
                        <div className="text-lg font-semibold text-gray-900 capitalize">
                          {typedInsights?.metadata?.analysis_type?.replace('_', ' ') || 'Statistical'}
                          {typedInsights?.fallback_used && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                              Fallback
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-600">Confidence Level</div>
                        <div className="text-lg font-semibold text-gray-900">{((typedInsights?.confidence || 0) * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI insights available</h3>
                  <p className="text-gray-600">Loading filter data to generate AI recommendations...</p>
                </CardContent>
              </Card>
            )}

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

// Collapsible AI sections (same behavior as insights page)
function AIInsightsSections({ aiSummary }: { aiSummary: string }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  const toggleSection = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const parseAISummary = (summary: string) => {
    const sections: { title: string; content: string; key: string }[] = []
    const lines = (summary || '').split('\n')
    let current: { title: string; content: string; key: string } | null = null

    for (const raw of lines) {
      const line = raw.trim()
      // Match '## Title' or '### Title'
      const hMd = line.match(/^#{2,3}\s*(.+)$/)
      // Match '**1. Title:**' or '**1. Title**'
      const hBoldNum = line.match(/^\*\*\s*\d+\.\s*(.+?)(?:\*\*|:)?\s*$/)
      // Match '1. Title'
      const hNum = line.match(/^\d+\.\s*(.+)$/)

      if (hMd || hBoldNum || hNum) {
        if (current) sections.push(current)
        const titleText = (hMd?.[1] || hBoldNum?.[1] || hNum?.[1] || '').trim()
        const title = titleText.replace(/\*\*/g, '').replace(/:+$/, '')
        const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        current = { title, content: '', key }
      } else if (current && line) {
        current.content += (current.content ? '\n' : '') + raw
      }
    }
    if (current) sections.push(current)
    return sections
  }

  const sections = parseAISummary(aiSummary)

  if (sections.length === 0) {
    return <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{aiSummary}</div>
  }

  return (
    <div className="space-y-3">
      {sections.map((s, idx) => (
        <Collapsible
          key={s.key}
          open={openSections[s.key] || idx === 0}
          onOpenChange={() => toggleSection(s.key)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto text-left hover:bg-white/60 border border-purple-100 rounded-md"
            >
              <span className="font-semibold text-gray-900">{s.title}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  openSections[s.key] || (idx === 0 && openSections[s.key] !== false) ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="pl-4 pr-2 pb-3 text-sm text-gray-800 whitespace-pre-line leading-relaxed">
              {s.content.trim()}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  )
}