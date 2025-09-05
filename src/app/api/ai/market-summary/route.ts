import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { geminiService } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { city, marketData } = body

    if (!city || !marketData) {
      return NextResponse.json({ error: 'City and market data are required' }, { status: 400 })
    }

    // Generate AI summary with Gemini
    const prompt = `You are a real estate market analyst. Based on the following market data for ${city}, provide a comprehensive market analysis for someone new to the city who is looking for rental properties.

Market Data:
- Total Listings: ${marketData.totalListings}
- Average Rent: ₹${marketData.avgRent?.toLocaleString()}
- Most Expensive Area: ${marketData.mostExpensiveArea}
- Most Affordable Area: ${marketData.mostAffordableArea}
- Popular Property Type: ${marketData.topBHK}
- Top Amenities: ${marketData.topAmenities?.join(', ')}

Please provide insights in the following format:

## ${city} Rental Market Overview

### 🏢 Market Summary
[Brief overview of the rental market - 2-3 sentences about market size and activity]

### 💰 Pricing Insights
[Analysis of rent ranges, expensive vs affordable areas, value for money locations]

### 🏠 Property Recommendations
[Which BHK types are most popular, what to expect in different price ranges]

### 📍 Area Guide
[Quick guide to expensive vs affordable areas, what makes each area popular]

### 🎯 Best Suited For
[Recommendations for different types of residents - professionals, families, students, bachelors]

### 💡 Insider Tips
[Practical advice for someone new to ${city} looking for rentals]

Keep it concise, practical, and focused on actionable insights for renters. Use bullet points where appropriate and maintain a helpful, informative tone.`

    try {
      const aiResponse = await geminiService.generateInsights(user.id, prompt)
      
      if (!aiResponse?.content) {
        throw new Error('No AI response generated')
      }

      return NextResponse.json({
        summary: aiResponse.content,
        city,
        cached: false
      })

    } catch (aiError) {
      console.error('AI summary generation failed:', aiError)
      
      // Generate fallback summary
      const fallbackSummary = `## ${city} Market Overview

### 🏢 Market Summary
The ${city} rental market has ${marketData.totalListings} active listings with an average rent of ₹${marketData.avgRent?.toLocaleString()} per month. The market shows healthy activity with diverse property options.

### 💰 Pricing Insights
• **Premium Areas**: ${marketData.mostExpensiveArea} commands the highest rents
• **Budget-Friendly**: ${marketData.mostAffordableArea} offers more affordable options
• **Average Rent**: ₹${marketData.avgRent?.toLocaleString()}/month across all property types

### 🏠 Property Recommendations
• **Most Popular**: ${marketData.topBHK} properties are in highest demand
• **Property Mix**: Diverse options available from budget to premium segments
• **Market Activity**: ${marketData.totalListings} active listings indicate good availability

### 📍 Area Guide
• **${marketData.mostExpensiveArea}**: Premium locality with higher rents but better amenities
• **${marketData.mostAffordableArea}**: Budget-friendly area suitable for cost-conscious renters
• Consider commute distance and local amenities when choosing areas

### 🎯 Best Suited For
• **Professionals**: Consider areas with good connectivity to business hubs
• **Families**: Look for ${marketData.topBHK} properties in residential areas
• **Budget-Conscious**: Explore ${marketData.mostAffordableArea} and surrounding areas

### 💡 Insider Tips
• **Top Amenities**: Properties with ${marketData.topAmenities?.slice(0, 3).join(', ')} are popular
• **Negotiation**: Room for rent negotiation varies by area and property condition
• **Best Time**: End of month or mid-week property visits often yield better deals

*Note: AI-powered detailed analysis temporarily unavailable. Data analysis based on current market statistics.*`

      return NextResponse.json({
        summary: fallbackSummary,
        city,
        cached: false,
        fallback: true
      })
    }

  } catch (error) {
    console.error('Market summary API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate market summary' },
      { status: 500 }
    )
  }
}