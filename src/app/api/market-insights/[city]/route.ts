import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { geminiService } from '@/lib/gemini'

export interface MarketInsightsData {
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

export interface MarketInsightsResponse {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string }> }
) {
  try {
    const { city } = await params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const timePeriod = searchParams.get('period') || 'Last 30 days'
    
    const supabase = createRouteHandlerClient({
      cookies: cookies,
    })

    // Authentication check
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to access market insights'
      }, { status: 401 })
    }

    // Fetch user filter data for the specified city and time period
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: filterData, error: filterError } = await supabase
      .from('user_search_filters')
      .select(`
        id,
        user_id,
        city,
        state,
        area,
        property_type,
        min_rent,
        max_rent,
        amenities,
        filters,
        usage_count,
        last_used,
        created_at
      `)
      .ilike('city', `%${city}%`)
      .gte('last_used', startDate.toISOString())
      .order('usage_count', { ascending: false })

    if (filterError) {
      console.error('Filter data query error:', filterError)
      return NextResponse.json({ 
        error: 'Failed to fetch market data',
        details: filterError.message 
      }, { status: 500 })
    }

    if (!filterData || filterData.length === 0) {
      return NextResponse.json({
        success: true,
        data: generateEmptyInsights(city),
        aiInsights: `No search data available for ${city} in the last ${days} days. This could indicate a new market opportunity or low user activity in this region.`,
        actionableRecommendations: [
          'Consider marketing efforts to increase user awareness in this city',
          'Focus on building inventory to establish market presence',
          'Partner with local brokers to understand market dynamics'
        ],
        confidence: 0.1,
        metadata: {
          city,
          timePeriod,
          totalFilterRecords: 0,
          analysisDate: new Date().toISOString(),
          fallbackUsed: false
        }
      })
    }

    // Process and analyze the filter data
    const marketData = await analyzeFilterData(filterData, city)

    // Generate AI insights
    let aiInsights = ''
    let actionableRecommendations: string[] = []
    let fallbackUsed = false

    try {
      const aiPrompt = createComprehensiveInsightPrompt(marketData, city, days)
      const aiResult = await geminiService.generateInsights(session.user.id, aiPrompt)
      
      if (aiResult?.content) {
        aiInsights = aiResult.content
        actionableRecommendations = aiResult.recommendations || []
      } else {
        throw new Error('No AI content generated')
      }
    } catch (error) {
      console.log('AI generation failed, using statistical analysis:', error)
      fallbackUsed = true
      
      const fallbackResult = generateStatisticalInsights(marketData, city, days)
      aiInsights = fallbackResult.insights
      actionableRecommendations = fallbackResult.recommendations
    }

    return NextResponse.json({
      success: true,
      data: marketData,
      aiInsights,
      actionableRecommendations,
      confidence: fallbackUsed ? 0.7 : 0.9,
      metadata: {
        city,
        timePeriod,
        totalFilterRecords: filterData.length,
        analysisDate: new Date().toISOString(),
        fallbackUsed
      }
    })

  } catch (error) {
    console.error('Market insights API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function analyzeFilterData(filterData: Array<{
  id: string
  user_id: string
  city?: string
  state?: string
  area?: string
  property_type?: string
  min_rent?: number
  max_rent?: number
  amenities?: string[]
  filters?: Record<string, unknown>
  usage_count?: number
  last_used: string
  created_at: string
}>, _city: string): Promise<MarketInsightsData> {
  // Basic statistics
  const totalSearches = filterData.reduce((sum, item) => sum + (item.usage_count || 1), 0)
  const uniqueUsers = new Set(filterData.map(item => item.user_id)).size

  // Property type analysis
  const propertyTypeCount: { [key: string]: number } = {}
  filterData.forEach(item => {
    const propertyType = item.property_type || extractFromFilters(item.filters, 'property_type') || 'apartment'
    propertyTypeCount[propertyType] = (propertyTypeCount[propertyType] || 0) + (item.usage_count || 1)
  })

  const propertyTypeDemand = Object.entries(propertyTypeCount)
    .map(([type, count]) => ({
      property_type: type,
      search_count: count,
      percentage: Math.round((count / totalSearches) * 100)
    }))
    .sort((a, b) => b.search_count - a.search_count)

  const topProperty = propertyTypeDemand[0]?.property_type || 'N/A'

  // Amenities analysis
  const amenityCount: { [key: string]: number } = {}
  filterData.forEach(item => {
    // From amenities array
    if (item.amenities && Array.isArray(item.amenities)) {
      item.amenities.forEach((amenity: string) => {
        amenityCount[amenity] = (amenityCount[amenity] || 0) + (item.usage_count || 1)
      })
    }
    
    // From filters JSON
    if (item.filters) {
      const amenities = extractArrayFromFilters(item.filters, 'amenities') || []
      amenities.forEach((amenity: string) => {
        amenityCount[amenity] = (amenityCount[amenity] || 0) + (item.usage_count || 1)
      })
    }
  })

  const amenitiesRanking = Object.entries(amenityCount)
    .map(([amenity, count]) => ({ amenity, usage_count: count }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10)

  // Budget distribution analysis
  const budgetDistribution = {
    '< ₹15k': 0,
    '₹15k-25k': 0,
    '₹25k-40k': 0,
    '> ₹40k': 0
  }

  filterData.forEach(item => {
    const maxRentValue = extractFromFilters(item.filters, 'budget_max')
    const maxRent = Number(item.max_rent || maxRentValue || item.min_rent || 25000)
    const count = item.usage_count || 1
    
    if (maxRent < 15000) {
      budgetDistribution['< ₹15k'] += count
    } else if (maxRent <= 25000) {
      budgetDistribution['₹15k-25k'] += count
    } else if (maxRent <= 40000) {
      budgetDistribution['₹25k-40k'] += count
    } else {
      budgetDistribution['> ₹40k'] += count
    }
  })

  // Popular areas analysis
  const areaCount: { [key: string]: number } = {}
  filterData.forEach(item => {
    const area = item.area || extractFromFilters(item.filters, 'locality') || extractArrayFromFilters(item.filters, 'locality')?.[0]
    if (area) {
      areaCount[area] = (areaCount[area] || 0) + (item.usage_count || 1)
    }
  })

  const popularAreas = Object.entries(areaCount)
    .map(([area, count]) => ({ area, search_count: count }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, 15)

  const topLocation = popularAreas[0]?.area || 'N/A'

  // Demographics analysis
  let maleCount = 0, femaleCount = 0, totalGender = 0
  let brokerCount = 0, noBrokerCount = 0, totalBrokerPref = 0

  filterData.forEach(item => {
    const count = item.usage_count || 1
    
    // Gender preferences
    const gender = extractFromFilters(item.filters, 'gender') || extractArrayFromFilters(item.filters, 'gender')?.[0]
    if (gender) {
      totalGender += count
      if (gender.toLowerCase().includes('male')) {
        maleCount += count
      } else if (gender.toLowerCase().includes('female')) {
        femaleCount += count
      }
    }
    
    // Broker preferences
    const brokerPref = extractFromFilters(item.filters, 'broker') || extractArrayFromFilters(item.filters, 'broker')?.[0]
    if (brokerPref) {
      totalBrokerPref += count
      if (brokerPref.toLowerCase().includes('no broker')) {
        noBrokerCount += count
      } else {
        brokerCount += count
      }
    }
  })

  const demographics = {
    malePercentage: totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0,
    femalePercentage: totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0,
    brokerPreference: totalBrokerPref > 0 ? Math.round((brokerCount / totalBrokerPref) * 100) : 0,
    noBrokerPreference: totalBrokerPref > 0 ? Math.round((noBrokerCount / totalBrokerPref) * 100) : 0,
  }

  // Occupancy preferences
  const occupancyCount: { [key: string]: number } = {}
  filterData.forEach(item => {
    const occupancy = extractFromFilters(item.filters, 'occupancy') || extractArrayFromFilters(item.filters, 'occupancy')?.[0]
    if (occupancy) {
      occupancyCount[occupancy] = (occupancyCount[occupancy] || 0) + (item.usage_count || 1)
    }
  })

  const occupancyPreferences = Object.entries(occupancyCount)
    .map(([occupancy, count]) => ({ occupancy, count }))
    .sort((a, b) => b.count - a.count)

  // Lifestyle preferences
  const lifestyleCount: { [key: string]: number } = {}
  filterData.forEach(item => {
    const lifestyle = extractFromFilters(item.filters, 'lifestyle') || extractArrayFromFilters(item.filters, 'lifestyle')?.[0]
    const food = extractFromFilters(item.filters, 'food') || extractArrayFromFilters(item.filters, 'food')?.[0]
    
    if (lifestyle) {
      lifestyleCount[lifestyle] = (lifestyleCount[lifestyle] || 0) + (item.usage_count || 1)
    }
    if (food) {
      lifestyleCount[food] = (lifestyleCount[food] || 0) + (item.usage_count || 1)
    }
  })

  const lifestylePreferences = Object.entries(lifestyleCount)
    .map(([lifestyle, count]) => ({ lifestyle, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalSearches,
    uniqueUsers,
    topProperty,
    topLocation,
    propertyTypeDemand,
    amenitiesRanking,
    budgetDistribution,
    popularAreas,
    demographics,
    occupancyPreferences,
    lifestylePreferences
  }
}

function generateEmptyInsights(city: string): MarketInsightsData {
  return {
    totalSearches: 0,
    uniqueUsers: 0,
    topProperty: 'N/A',
    topLocation: 'N/A',
    propertyTypeDemand: [],
    amenitiesRanking: [],
    budgetDistribution: {
      '< ₹15k': 0,
      '₹15k-25k': 0,
      '₹25k-40k': 0,
      '> ₹40k': 0
    },
    popularAreas: [],
    demographics: {
      malePercentage: 0,
      femalePercentage: 0,
      brokerPreference: 0,
      noBrokerPreference: 0
    },
    occupancyPreferences: [],
    lifestylePreferences: []
  }
}

function extractFromFilters(filters: Record<string, unknown> | null | undefined, key: string): string | null {
  if (!filters || typeof filters !== 'object') return null
  const value = filters[key]
  return typeof value === 'string' ? value : null
}

function extractArrayFromFilters(filters: Record<string, unknown> | null | undefined, key: string): string[] | null {
  if (!filters || typeof filters !== 'object') return null
  const value = filters[key]
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return null
}

function createComprehensiveInsightPrompt(data: MarketInsightsData, city: string, days: number): string {
  return `Analyze this comprehensive real estate market data for ${city} over ${days} days and provide strategic broker insights:

MARKET OVERVIEW:
- Total Searches: ${data.totalSearches}
- Unique Users: ${data.uniqueUsers}
- Top Property Type: ${data.topProperty}
- Most Popular Area: ${data.topLocation}

PROPERTY TYPE DEMAND:
${data.propertyTypeDemand.map(item => `- ${item.property_type}: ${item.search_count} searches (${item.percentage}%)`).join('\n')}

BUDGET PREFERENCES:
- Under ₹15k: ${data.budgetDistribution['< ₹15k']} searches
- ₹15k-25k: ${data.budgetDistribution['₹15k-25k']} searches  
- ₹25k-40k: ${data.budgetDistribution['₹25k-40k']} searches
- Above ₹40k: ${data.budgetDistribution['> ₹40k']} searches

TOP AMENITIES:
${data.amenitiesRanking.slice(0, 8).map((item, i) => `${i+1}. ${item.amenity}: ${item.usage_count} searches`).join('\n')}

POPULAR AREAS:
${data.popularAreas.slice(0, 8).map((item, i) => `${i+1}. ${item.area}: ${item.search_count} searches`).join('\n')}

DEMOGRAPHICS:
- Male preference: ${data.demographics.malePercentage}%
- Female preference: ${data.demographics.femalePercentage}%
- Broker preference: ${data.demographics.brokerPreference}%
- No-broker preference: ${data.demographics.noBrokerPreference}%

OCCUPANCY PATTERNS:
${data.occupancyPreferences.slice(0, 5).map(item => `- ${item.occupancy}: ${item.count} searches`).join('\n')}

LIFESTYLE PREFERENCES:
${data.lifestylePreferences.slice(0, 5).map(item => `- ${item.lifestyle}: ${item.count} searches`).join('\n')}

Please provide:
1. **MARKET DEMAND ANALYSIS**: Key trends and opportunities
2. **PRICING STRATEGY**: Optimal rent ranges for different segments  
3. **LOCATION FOCUS**: Priority areas for investment and marketing
4. **TENANT TARGETING**: Demographic and lifestyle insights
5. **COMPETITIVE POSITIONING**: How to differentiate from competition
6. **ACTIONABLE RECOMMENDATIONS**: 5-7 specific tactics brokers should implement

Format with clear sections and data-backed insights that brokers can act on immediately.`
}

function generateStatisticalInsights(data: MarketInsightsData, city: string, days: number) {
  const topProperty = data.propertyTypeDemand[0]?.property_type || 'N/A'
  const topArea = data.popularAreas[0]?.area || 'N/A'
  const topAmenity = data.amenitiesRanking[0]?.amenity || 'N/A'
  const topBudgetRange = Object.entries(data.budgetDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

  const insights = `# Market Analysis Report for ${city}

## 📊 Market Demand Analysis
The ${city} rental market shows ${data.totalSearches > 500 ? 'strong' : data.totalSearches > 100 ? 'moderate' : 'emerging'} activity with ${data.totalSearches} total searches from ${data.uniqueUsers} unique users over ${days} days.

**Property Type Trends:**
- ${topProperty} dominates demand with ${data.propertyTypeDemand[0]?.percentage}% market share
- ${data.propertyTypeDemand.length} different property types show active demand
- Market concentration indicates ${data.propertyTypeDemand[0]?.percentage > 50 ? 'focused' : 'diverse'} tenant preferences

## 💰 Pricing Strategy  
**Optimal Budget Ranges:**
- ${topBudgetRange} segment leads market demand
- Price distribution shows balanced spread across income segments
- ${data.budgetDistribution['> ₹40k'] > data.budgetDistribution['< ₹15k'] ? 'Premium' : 'Affordable'} segment dominance

## 🗺️ Location Focus
**Priority Investment Areas:**
- ${topArea} shows highest search volume (${data.popularAreas[0]?.search_count} searches)
- Top 5 areas account for ${data.popularAreas.slice(0, 5).reduce((sum, area) => sum + area.search_count, 0)} total searches
- Geographic spread across ${data.popularAreas.length} distinct locations

## 👥 Tenant Demographics
**Target Segments:**
- Gender preference: ${data.demographics.malePercentage}% male, ${data.demographics.femalePercentage}% female
- Broker relationship: ${data.demographics.noBrokerPreference}% prefer direct deals
- Lifestyle preferences favor ${data.lifestylePreferences[0]?.lifestyle || 'standard'} living

## 🏠 Property Features
**Essential Amenities:**
${data.amenitiesRanking.slice(0, 5).map(a => `- ${a.amenity} (${a.usage_count} requests)`).join('\n')}

**Occupancy Patterns:**
${data.occupancyPreferences.slice(0, 3).map(o => `- ${o.occupancy}: ${o.count} preferences`).join('\n')}`

  const recommendations = [
    `Focus inventory on ${topProperty} properties for maximum market reach`,
    `Prioritize listings in ${topArea} and surrounding high-demand areas`,
    `Price competitively within ${topBudgetRange} range for optimal visibility`,
    `Emphasize ${topAmenity} and top amenities in marketing materials`,
    `Target ${data.demographics.noBrokerPreference > 50 ? 'direct-to-tenant' : 'broker-assisted'} marketing approach`,
    `Consider ${data.propertyTypeDemand[1]?.property_type || 'alternative'} properties for portfolio diversification`,
    `Focus on ${data.occupancyPreferences[0]?.occupancy || 'flexible'} occupancy arrangements`
  ].filter(r => !r.includes('N/A'))

  return {
    insights,
    recommendations
  }
}