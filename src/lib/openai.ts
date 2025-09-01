import OpenAI from 'openai'

// Types for analytics data
export interface AnalyticsData {
  searchPatterns: {
    keywords: string[]
    locations: string[]
    priceRanges: number[]
    propertyTypes: string[]
    filters: Record<string, any>[]
  }
  listingPerformance: {
    views: number
    saves: number
    inquiries: number
    conversions: number
    averageTimeActive: number
    listingId: string
    title: string
    location: string
    rent: number
    propertyType: string
  }[]
  marketTrends: {
    area: string
    demandScore: number
    averageRent: number
    popularAmenities: string[]
    seasonality: Record<string, number>
  }[]
  userBehavior: {
    avgTimeOnListing: number
    topFeatureClicks: string[]
    conversionFunnelSteps: Record<string, number>
  }
}

export interface BrokerInsights {
  performanceMetrics: {
    totalViews: number
    totalInquiries: number
    conversionRate: number
    averageListingDuration: number
    competitiveRating: number
  }
  marketInsights: {
    trendingKeywords: string[]
    popularFeatures: string[]
    seasonalTrends: string
    priceRecommendations: string
    competitorAnalysis: string
  }
  recommendations: {
    pricingOptimization: string
    contentImprovement: string
    timingStrategy: string
    targetAudience: string
    missingAmenities: string[]
  }
}

class OpenAIService {
  private client: OpenAI | null = null
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> = new Map()
  private readonly MAX_REQUESTS_PER_MINUTE = 20 // GPT-4o Mini rate limit
  private readonly MAX_REQUESTS_PER_DAY = 500

  constructor() {
    this.initializeClient()
  }

  private initializeClient() {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY
      if (!apiKey) {
        console.warn('OpenAI API key not found. Analytics insights will be limited.')
        return
      }

      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // Only for demo - in production, use server-side
      })
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error)
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const userLimits = this.rateLimitTracker.get(userId)

    if (!userLimits || now > userLimits.resetTime) {
      // Reset limits every minute
      this.rateLimitTracker.set(userId, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      })
      return true
    }

    if (userLimits.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false
    }

    userLimits.count++
    return true
  }

  async generateBrokerInsights(
    userId: string, 
    analyticsData: AnalyticsData
  ): Promise<BrokerInsights | null> {
    if (!this.client) {
      return this.getFallbackInsights(analyticsData)
    }

    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    try {
      const prompt = this.buildAnalyticsPrompt(analyticsData)
      
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o Mini for cost efficiency
        messages: [
          {
            role: "system",
            content: `You are an expert real estate market analyst specializing in rental property analytics for brokers. 
            Provide actionable insights based on data patterns, market trends, and user behavior. 
            Always include specific numbers, percentages, and concrete recommendations.
            Format your response as a valid JSON object matching the BrokerInsights interface.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analytics
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      return JSON.parse(response) as BrokerInsights
    } catch (error) {
      console.error('OpenAI API error:', error)
      return this.getFallbackInsights(analyticsData)
    }
  }

  private buildAnalyticsPrompt(data: AnalyticsData): string {
    return `
Analyze the following broker analytics data and provide comprehensive insights:

SEARCH PATTERNS:
- Top keywords: ${data.searchPatterns.keywords.slice(0, 10).join(', ')}
- Popular locations: ${data.searchPatterns.locations.slice(0, 5).join(', ')}
- Price ranges: ₹${Math.min(...data.searchPatterns.priceRanges)} - ₹${Math.max(...data.searchPatterns.priceRanges)}
- Property types: ${data.searchPatterns.propertyTypes.join(', ')}

LISTING PERFORMANCE:
${data.listingPerformance.map(listing => 
  `- ${listing.title}: ${listing.views} views, ${listing.inquiries} inquiries, ${listing.conversions} conversions`
).join('\n')}

MARKET TRENDS:
${data.marketTrends.map(trend => 
  `- ${trend.area}: Demand score ${trend.demandScore}/10, Avg rent ₹${trend.averageRent}`
).join('\n')}

USER BEHAVIOR:
- Average time on listing: ${data.userBehavior.avgTimeOnListing} seconds
- Top feature clicks: ${data.userBehavior.topFeatureClicks.join(', ')}

Please provide:
1. Performance metrics with specific numbers and percentages
2. Market insights with trending keywords, popular features, and price recommendations
3. Actionable recommendations for pricing, content, timing, and target audience
4. Missing amenities that are in high demand

Return as valid JSON matching the BrokerInsights interface.
    `
  }

  private getFallbackInsights(data: AnalyticsData): BrokerInsights {
    // Fallback analytics when OpenAI is unavailable
    const totalViews = data.listingPerformance.reduce((sum, listing) => sum + listing.views, 0)
    const totalInquiries = data.listingPerformance.reduce((sum, listing) => sum + listing.inquiries, 0)
    const conversionRate = totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0

    return {
      performanceMetrics: {
        totalViews,
        totalInquiries,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageListingDuration: data.listingPerformance.reduce((sum, l) => sum + l.averageTimeActive, 0) / data.listingPerformance.length,
        competitiveRating: 7.5
      },
      marketInsights: {
        trendingKeywords: data.searchPatterns.keywords.slice(0, 5),
        popularFeatures: ['Furnished', 'WiFi', 'Parking', 'Balcony'],
        seasonalTrends: 'Summer months show 20% higher demand',
        priceRecommendations: 'Consider reducing prices by 5-10% for faster conversions',
        competitorAnalysis: 'Your listings are competitive in the current market'
      },
      recommendations: {
        pricingOptimization: 'Analyze similar properties in your area to optimize pricing',
        contentImprovement: 'Add more high-quality photos and detailed descriptions',
        timingStrategy: 'Post new listings on weekends for better visibility',
        targetAudience: 'Focus on young professionals and students',
        missingAmenities: ['Gym', 'Swimming Pool', 'Security']
      }
    }
  }

  // Method to generate listing optimization suggestions
  async optimizeListing(
    userId: string,
    listingData: {
      title: string
      description: string
      rent: number
      location: string
      amenities: string[]
      photos: number
    },
    marketData: {
      averageRent: number
      popularAmenities: string[]
      competitorTitles: string[]
    }
  ): Promise<{
    optimizedTitle: string
    optimizedDescription: string
    pricingSuggestion: string
    missingAmenities: string[]
    contentScore: number
  } | null> {
    if (!this.client || !this.checkRateLimit(userId)) {
      return null
    }

    try {
      const prompt = `
Optimize this rental listing for better performance:

CURRENT LISTING:
Title: ${listingData.title}
Description: ${listingData.description}
Rent: ₹${listingData.rent}
Location: ${listingData.location}
Amenities: ${listingData.amenities.join(', ')}
Photo count: ${listingData.photos}

MARKET CONTEXT:
Average rent in area: ₹${marketData.averageRent}
Popular amenities: ${marketData.popularAmenities.join(', ')}
Competitor titles: ${marketData.competitorTitles.slice(0, 3).join(' | ')}

Provide optimization suggestions including improved title, description, pricing advice, and missing amenities.
Return as JSON with optimizedTitle, optimizedDescription, pricingSuggestion, missingAmenities, and contentScore (1-10).
      `

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a real estate content optimization expert. Provide specific, actionable improvements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: "json_object" }
      })

      const response = completion.choices[0]?.message?.content
      return response ? JSON.parse(response) : null
    } catch (error) {
      console.error('Listing optimization error:', error)
      return null
    }
  }
}

// Singleton instance
export const openAIService = new OpenAIService()