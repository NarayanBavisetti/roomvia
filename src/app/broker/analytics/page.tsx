'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { analyticsService } from '@/lib/analytics'
import { openAIService } from '@/lib/openai'
import type { BrokerInsights, AnalyticsData } from '@/lib/openai'
import Navbar from '@/components/navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MessageSquare, 
  MapPin,
  Target,
  Lightbulb,
  RefreshCw,
  Home,
  Search,
  Sparkles
} from 'lucide-react'

interface PerformanceMetrics {
  totalViews: number
  totalInquiries: number
  totalListings: number
  conversionRate: number
  avgViewsPerListing: number
  avgInquiriesPerListing: number
}

interface ListingPerformance {
  listingId: string
  title: string
  location: string
  rent: number
  propertyType: string
  views: number
  saves: number
  inquiries: number
  phoneReveals: number
  avgTimeSpent: number
  conversionRate: number
}

export default function BrokerAnalyticsPage() {
  const { user, loading } = useAuth()
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [listingPerformance, setListingPerformance] = useState<ListingPerformance[]>([])
  const [searchTrends, setSearchTrends] = useState<import('@/lib/analytics').SearchTrends | null>(null)
  const [marketTrends, setMarketTrends] = useState<import('@/lib/analytics').MarketTrend[]>([])
  const [aiInsights, setAiInsights] = useState<BrokerInsights | null>(null)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState<7 | 30 | 90>(30)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    if (user) {
      loadAnalyticsData()
    }
  }, [user, selectedTimeRange])

  const loadAnalyticsData = async () => {
    if (!user) return

    setIsLoadingData(true)
    try {
      // Load basic analytics
      const analytics = await analyticsService.getBrokerAnalytics(user.id, selectedTimeRange)
      const listingData = await analyticsService.getListingAnalytics(user.id, selectedTimeRange)
      const trends = await analyticsService.getSearchTrends(selectedTimeRange)
      const market = await analyticsService.getMarketTrends()

      if (analytics?.performance) {
        const listingCount = Math.max(listingData.length || analytics.performance.totalListings || 0, 1)
        setPerformanceMetrics({
          totalViews: analytics.performance.totalViews,
          totalInquiries: analytics.performance.totalInquiries,
          totalListings: analytics.performance.totalListings,
          conversionRate: analytics.performance.conversionRate,
          avgViewsPerListing: analytics.performance.totalViews / listingCount,
          avgInquiriesPerListing: analytics.performance.totalInquiries / listingCount
        })
      }

      // Process listing data
      const processedListings = listingData.map((item) => ({
        listingId: item.listing_id,
        title: item.listing?.title || 'Unknown Listing',
        location: item.listing?.location || 'Unknown Location',
        rent: item.listing?.rent || 0,
        propertyType: item.listing?.property_type || 'Unknown',
        views: item.views || 0,
        saves: item.saves || 0,
        inquiries: item.inquiries || 0,
        phoneReveals: item.phone_reveals || 0,
        avgTimeSpent: 0, // Would need to calculate from user_behavior data
        conversionRate: item.views > 0 ? (item.inquiries / item.views) * 100 : 0
      }))

      setListingPerformance(processedListings)
      setSearchTrends(trends)
      setMarketTrends(market)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const generateAIInsights = async () => {
    if (!user || !performanceMetrics) return

    setIsLoadingInsights(true)
    try {
      // Prepare analytics data for AI processing
      const analyticsData: AnalyticsData = {
        searchPatterns: {
          keywords: searchTrends?.keywords || [],
          locations: searchTrends?.locations || [],
          priceRanges: (searchTrends?.priceRanges || []).map((r) => r.min),
          propertyTypes: searchTrends?.propertyTypes || [],
          filters: []
        },
        listingPerformance: listingPerformance.map(listing => ({
          views: listing.views,
          saves: listing.saves,
          inquiries: listing.inquiries,
          conversions: Math.round(listing.inquiries * 0.3), // Estimate conversions
          averageTimeActive: 30, // Default assumption
          listingId: listing.listingId,
          title: listing.title,
          location: listing.location,
          rent: listing.rent,
          propertyType: listing.propertyType
        })),
        marketTrends: marketTrends.map(trend => ({
          area: trend.area || 'Unknown',
          demandScore: trend.demand_score || 5,
          averageRent: trend.avg_rent || 0,
          popularAmenities: trend.popular_amenities || [],
          seasonality: {}
        })),
        userBehavior: {
          avgTimeOnListing: 45000, // 45 seconds default
          topFeatureClicks: ['photos', 'contact', 'save'],
          conversionFunnelSteps: {
            view: 100,
            save: 15,
            inquiry: 8,
            conversion: 3
          }
        }
      }

      const insights = await openAIService.generateBrokerInsights(user.id, analyticsData)
      setAiInsights(insights)
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
      // Show user-friendly error message
      alert('Failed to generate AI insights. Please try again later.')
    } finally {
      setIsLoadingInsights(false)
    }
  }

  if (loading || isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16 max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">Please log in to access broker analytics.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
                <p className="text-gray-600">AI-powered insights for your property listings</p>
              </div>
              <div className="flex items-center gap-4 mt-4 sm:mt-0">
                {/* Time Range Selector */}
                <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                  {[7, 30, 90].map(days => (
                    <button
                      key={days}
                      onClick={() => setSelectedTimeRange(days as 7 | 30 | 90)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        selectedTimeRange === days
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <Button onClick={() => loadAnalyticsData()} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {performanceMetrics.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inquiries</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {performanceMetrics.totalInquiries.toLocaleString()}
                      </p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {performanceMetrics.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Listings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {performanceMetrics.totalListings}
                      </p>
                    </div>
                    <Home className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* AI Insights Section */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI-Powered Insights
                </CardTitle>
                <Button 
                  onClick={generateAIInsights} 
                  disabled={isLoadingInsights}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoadingInsights ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Insights
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiInsights ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Market Insights */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      Market Insights
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Trending Keywords</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {aiInsights.marketInsights.trendingKeywords.slice(0, 5).map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Popular Features</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {aiInsights.marketInsights.popularFeatures.slice(0, 4).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Seasonal Trends</p>
                        <p className="text-sm text-gray-700 mt-1">{aiInsights.marketInsights.seasonalTrends}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-500" />
                      Recommendations
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pricing Optimization</p>
                        <p className="text-sm text-gray-700 mt-1">{aiInsights.recommendations.pricingOptimization}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Content Improvement</p>
                        <p className="text-sm text-gray-700 mt-1">{aiInsights.recommendations.contentImprovement}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Missing Amenities</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {aiInsights.recommendations.missingAmenities.slice(0, 3).map((amenity, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              + {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Performance Score
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-600">Competitive Rating</p>
                          <span className="text-sm font-bold text-gray-900">
                            {aiInsights.performanceMetrics.competitiveRating}/10
                          </span>
                        </div>
                        <Progress 
                          value={aiInsights.performanceMetrics.competitiveRating * 10} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Avg Listing Duration</p>
                        <p className="text-sm text-gray-700">
                          {Math.round(aiInsights.performanceMetrics.averageListingDuration)} days
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Target Audience</p>
                        <p className="text-sm text-gray-700">{aiInsights.recommendations.targetAudience}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Generate AI Insights</h3>
                  <p className="text-gray-600 mb-4">
                    Get personalized recommendations and market insights powered by AI
                  </p>
                  <Button onClick={generateAIInsights} className="bg-purple-600 hover:bg-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Trends */}
          {searchTrends && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-500" />
                    Popular Search Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchTrends.keywords.slice(0, 8).map((keyword: string, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{keyword}</span>
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Popular Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchTrends.locations.slice(0, 8).map((location: string, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{location}</span>
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Listing Performance Table */}
          {listingPerformance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Listing Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-medium text-gray-600">Property</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Views</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Saves</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Inquiries</th>
                        <th className="text-right py-3 px-2 font-medium text-gray-600">Conversion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listingPerformance.slice(0, 10).map((listing, index) => (
                        <tr key={listing.listingId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-xs">
                                {listing.title}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {listing.location} • ₹{listing.rent.toLocaleString()}
                              </p>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-gray-900">
                            {listing.views.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-2 text-gray-900">
                            {listing.saves.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-2 text-gray-900">
                            {listing.inquiries.toLocaleString()}
                          </td>
                          <td className="text-right py-3 px-2">
                            <Badge 
                              variant={listing.conversionRate > 5 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {listing.conversionRate.toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}