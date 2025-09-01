import { NextRequest, NextResponse } from 'next/server'
import { openAIService } from '@/lib/openai'
import { analyticsService } from '@/lib/analytics'
import type { AnalyticsData } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { userId, forceRefresh = false } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get analytics data from database
    const [brokerAnalytics, searchTrends, marketTrends] = await Promise.all([
      analyticsService.getBrokerAnalytics(userId, 30),
      analyticsService.getSearchTrends(30),
      analyticsService.getMarketTrends()
    ])

    // Get detailed listing performance
    const listingPerformance = await analyticsService.getListingAnalytics(userId, 30)

    // Prepare data for AI analysis
    const analyticsData: AnalyticsData = {
      searchPatterns: {
        keywords: searchTrends?.keywords || [],
        locations: searchTrends?.locations || [],
        priceRanges: searchTrends?.priceRanges?.map((r: any) => r.min) || [],
        propertyTypes: searchTrends?.propertyTypes || [],
        filters: []
      },
      listingPerformance: listingPerformance.map((listing: any) => ({
        views: listing.views || 0,
        saves: listing.saves || 0,
        inquiries: listing.inquiries || 0,
        conversions: Math.round((listing.inquiries || 0) * 0.3), // Estimate
        averageTimeActive: 30, // Default
        listingId: listing.listing_id,
        title: listing.listing?.title || 'Unknown',
        location: listing.listing?.location || 'Unknown',
        rent: listing.listing?.rent || 0,
        propertyType: listing.listing?.property_type || 'Unknown'
      })),
      marketTrends: marketTrends.map((trend: any) => ({
        area: trend.area || 'Unknown',
        demandScore: trend.demand_score || 5,
        averageRent: trend.avg_rent || 0,
        popularAmenities: trend.popular_amenities || [],
        seasonality: {}
      })),
      userBehavior: {
        avgTimeOnListing: 45000, // Default 45 seconds
        topFeatureClicks: ['photos', 'contact', 'save'],
        conversionFunnelSteps: {
          view: 100,
          save: 15,
          inquiry: 8,
          conversion: 3
        }
      }
    }

    // Generate AI insights
    const insights = await openAIService.generateBrokerInsights(userId, analyticsData)

    if (!insights) {
      return NextResponse.json(
        { error: 'Failed to generate insights' },
        { status: 500 }
      )
    }

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Analytics insights API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get cached insights
    const insights = await analyticsService.getBrokerInsights(userId, false)
    
    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Get insights API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}