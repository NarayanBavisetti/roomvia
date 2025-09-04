import { NextResponse } from 'next/server'

// Simple test endpoint to verify the market insights system works with mock data
export async function GET() {
  try {
    // Mock data that mimics the user_search_filters table structure
    const mockFilterData = [
      {
        id: '1',
        user_id: 'test-user-1',
        city: 'Bangalore',
        area: 'Koramangala',
        property_type: 'apartment',
        min_rent: 20000,
        max_rent: 30000,
        amenities: ['parking', 'gym', 'swimming_pool'],
        filters: {
          bhk: ['2 BHK'],
          gender: ['Male'],
          broker: ['No Broker'],
          amenities: ['parking', 'gym'],
          lifestyle: ['non_smoker']
        },
        usage_count: 5,
        last_used: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: '2', 
        user_id: 'test-user-2',
        city: 'Bangalore',
        area: 'HSR Layout',
        property_type: 'gated_community',
        min_rent: 25000,
        max_rent: 40000,
        amenities: ['air_conditioning', 'gym', 'attached_balcony'],
        filters: {
          bhk: ['3 BHK'],
          gender: ['Female'],
          broker: ['Broker'],
          amenities: ['air_conditioning', 'gym'],
          occupancy: ['quadruple']
        },
        usage_count: 3,
        last_used: new Date().toISOString(),
        created_at: new Date().toISOString()
      }
    ]

    // Simulate the analysis that would be done by analyzeFilterData
    const mockAnalysisResult = {
      totalSearches: 8,
      uniqueUsers: 2,
      topProperty: 'apartment',
      topLocation: 'Koramangala',
      propertyTypeDemand: [
        { property_type: 'apartment', search_count: 5, percentage: 63 },
        { property_type: 'gated_community', search_count: 3, percentage: 37 }
      ],
      amenitiesRanking: [
        { amenity: 'gym', usage_count: 8 },
        { amenity: 'parking', usage_count: 5 },
        { amenity: 'air_conditioning', usage_count: 3 }
      ],
      budgetDistribution: {
        '< ₹15k': 0,
        '₹15k-25k': 5,
        '₹25k-40k': 3,
        '> ₹40k': 0
      },
      popularAreas: [
        { area: 'Koramangala', search_count: 5 },
        { area: 'HSR Layout', search_count: 3 }
      ],
      demographics: {
        malePercentage: 63,
        femalePercentage: 37,
        brokerPreference: 37,
        noBrokerPreference: 63
      },
      occupancyPreferences: [
        { occupancy: 'quadruple', count: 3 }
      ],
      lifestylePreferences: [
        { lifestyle: 'non_smoker', count: 5 }
      ]
    }

    // Mock AI insights (what would be returned by fallback system)
    const mockInsights = `# Market Analysis for Bangalore (Test Data)

## 📊 MARKET DEMAND ANALYSIS

**Property Type Trends:**
• Apartments dominate demand with 63% market share (5 searches)
• Gated communities show strong premium segment demand at 37%
• Market shows balanced mix between affordable and premium properties

**Budget Range Preferences:**
• ₹15k-25k segment leads with 5 searches
• ₹25k-40k premium segment shows 3 searches
• Clear demand across middle-income segments

## 🗺️ LOCATION INSIGHTS

**Area Demand:**
• Koramangala leads with 5 searches - tech hub advantage
• HSR Layout shows 3 searches - emerging premium area
• Both areas indicate strong IT professional presence

## 💰 PRICING RECOMMENDATIONS

**Rent Optimization:**
• Focus on ₹15k-25k range for maximum market reach
• Premium ₹25k-40k segment viable for gated communities
• Koramangala can command higher rents due to location premium

## 👥 TENANT PREFERENCES

**Demographics:**
• 63% male preference - typical IT sector pattern
• 37% female preference shows growing diversity
• 63% prefer no-broker deals - direct marketing opportunity

**Amenity Priorities:**
• Gym facilities universally demanded (100% properties)
• Parking essential (63% searches)
• Air conditioning increasingly important (37%)

## 🎯 STRATEGIC RECOMMENDATIONS

This test data demonstrates the system's capability to analyze market patterns and provide actionable insights for real estate brokers.`

    const mockRecommendations = [
      'Focus on apartment properties in Koramangala for highest demand',
      'Price competitively in ₹15k-25k range for maximum market reach',
      'Emphasize gym and parking amenities in all property descriptions',
      'Target direct-to-tenant marketing (63% prefer no broker)',
      'Consider gated communities for premium ₹25k-40k segment',
      'Expand inventory to HSR Layout for growth opportunities'
    ]

    return NextResponse.json({
      success: true,
      data: mockAnalysisResult,
      aiInsights: mockInsights,
      actionableRecommendations: mockRecommendations,
      confidence: 0.7, // Indicating test/fallback data
      metadata: {
        city: 'Bangalore',
        timePeriod: 'Test Data',
        totalFilterRecords: 2,
        analysisDate: new Date().toISOString(),
        fallbackUsed: true,
        isTestData: true
      }
    })

  } catch (error) {
    console.error('Test market insights error:', error)
    return NextResponse.json(
      { 
        error: 'Test endpoint error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}