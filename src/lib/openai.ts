import OpenAI from "openai";

// Types for analytics data
export interface AnalyticsData {
  searchPatterns: {
    keywords: string[];
    locations: string[];
    priceRanges: number[];
    propertyTypes: string[];
    filters: Record<string, unknown>[];
  };
  listingPerformance: {
    views: number;
    saves: number;
    inquiries: number;
    conversions: number;
    averageTimeActive: number;
    listingId: string;
    title: string;
    location: string;
    rent: number;
    propertyType: string;
  }[];
  marketTrends: {
    area: string;
    demandScore: number;
    averageRent: number;
    popularAmenities: string[];
    seasonality: Record<string, number>;
  }[];
  userBehavior: {
    avgTimeOnListing: number;
    topFeatureClicks: string[];
    conversionFunnelSteps: Record<string, number>;
  };
}

export interface BrokerInsights {
  performanceMetrics: {
    totalViews: number;
    totalInquiries: number;
    conversionRate: number;
    averageListingDuration: number;
    competitiveRating: number;
  };
  marketInsights: {
    trendingKeywords: string[];
    popularFeatures: string[];
    seasonalTrends: string;
    priceRecommendations: string;
    competitorAnalysis: string;
  };
  recommendations: {
    pricingOptimization: string;
    contentImprovement: string;
    timingStrategy: string;
    targetAudience: string;
    missingAmenities: string[];
  };
}

class OpenAIService {
  private client: OpenAI | null = null;
  private rateLimitTracker: Map<string, { count: number; resetTime: number }> =
    new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 20; // GPT-4o Mini rate limit
  private readonly MAX_REQUESTS_PER_DAY = 500;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const apiKey =
        process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn(
          "OpenAI API key not found. Analytics insights will be limited."
        );
        return;
      }

      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true, // Only for demo - in production, use server-side
      });
    } catch (error) {
      console.error("Failed to initialize OpenAI client:", error as unknown);
    }
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimits = this.rateLimitTracker.get(userId);

    if (!userLimits || now > userLimits.resetTime) {
      // Reset limits every minute
      this.rateLimitTracker.set(userId, {
        count: 1,
        resetTime: now + 60000, // 1 minute
      });
      return true;
    }

    if (userLimits.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    userLimits.count++;
    return true;
  }

  async generateBrokerInsights(
    userId: string,
    analyticsData: AnalyticsData
  ): Promise<BrokerInsights | null> {
    if (!this.client) {
      return this.getFallbackInsights(analyticsData);
    }

    if (!this.checkRateLimit(userId)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    try {
      const prompt = this.buildAnalyticsPrompt(analyticsData);

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o Mini for cost efficiency
        messages: [
          {
            role: "system",
            content: `You are an expert real estate market analyst specializing in rental property analytics for brokers. 
            Provide actionable insights based on data patterns, market trends, and user behavior. 
            Always include specific numbers, percentages, and concrete recommendations.
            Format your response as a valid JSON object matching the BrokerInsights interface.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3, // Lower temperature for more consistent analytics
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(response) as BrokerInsights;
    } catch (error) {
      console.error("OpenAI API error:", error as unknown);
      return this.getFallbackInsights(analyticsData);
    }
  }

  private buildAnalyticsPrompt(data: AnalyticsData): string {
    return `
Analyze the following broker analytics data and provide comprehensive insights:

SEARCH PATTERNS:
- Top keywords: ${data.searchPatterns.keywords.slice(0, 10).join(", ")}
- Popular locations: ${data.searchPatterns.locations.slice(0, 5).join(", ")}
- Price ranges: ₹${Math.min(...data.searchPatterns.priceRanges)} - ₹${Math.max(
      ...data.searchPatterns.priceRanges
    )}
- Property types: ${data.searchPatterns.propertyTypes.join(", ")}

LISTING PERFORMANCE:
${data.listingPerformance
  .map(
    (listing) =>
      `- ${listing.title}: ${listing.views} views, ${listing.inquiries} inquiries, ${listing.conversions} conversions`
  )
  .join("\n")}

MARKET TRENDS:
${data.marketTrends
  .map(
    (trend) =>
      `- ${trend.area}: Demand score ${trend.demandScore}/10, Avg rent ₹${trend.averageRent}`
  )
  .join("\n")}

USER BEHAVIOR:
- Average time on listing: ${data.userBehavior.avgTimeOnListing} seconds
- Top feature clicks: ${data.userBehavior.topFeatureClicks.join(", ")}

Please provide:
1. Performance metrics with specific numbers and percentages
2. Market insights with trending keywords, popular features, and price recommendations
3. Actionable recommendations for pricing, content, timing, and target audience
4. Missing amenities that are in high demand

Return as valid JSON matching the BrokerInsights interface.
    `;
  }

  private getFallbackInsights(data: AnalyticsData): BrokerInsights {
    // Fallback analytics when OpenAI is unavailable
    const totalViews = data.listingPerformance.reduce(
      (sum, listing) => sum + listing.views,
      0
    );
    const totalInquiries = data.listingPerformance.reduce(
      (sum, listing) => sum + listing.inquiries,
      0
    );
    const conversionRate =
      totalViews > 0 ? (totalInquiries / totalViews) * 100 : 0;

    return {
      performanceMetrics: {
        totalViews,
        totalInquiries,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageListingDuration:
          data.listingPerformance.reduce(
            (sum, l) => sum + l.averageTimeActive,
            0
          ) / data.listingPerformance.length,
        competitiveRating: 7.5,
      },
      marketInsights: {
        trendingKeywords: data.searchPatterns.keywords.slice(0, 5),
        popularFeatures: ["Furnished", "WiFi", "Parking", "Balcony"],
        seasonalTrends: "Summer months show 20% higher demand",
        priceRecommendations:
          "Consider reducing prices by 5-10% for faster conversions",
        competitorAnalysis:
          "Your listings are competitive in the current market",
      },
      recommendations: {
        pricingOptimization:
          "Analyze similar properties in your area to optimize pricing",
        contentImprovement:
          "Add more high-quality photos and detailed descriptions",
        timingStrategy: "Post new listings on weekends for better visibility",
        targetAudience: "Focus on young professionals and students",
        missingAmenities: ["Gym", "Swimming Pool", "Security"],
      },
    };
  }

  // Method to generate listing optimization suggestions
  async optimizeListing(
    userId: string,
    listingData: {
      title: string;
      description: string;
      rent: number;
      location: string;
      amenities: string[];
      photos: number;
    },
    marketData: {
      averageRent: number;
      popularAmenities: string[];
      competitorTitles: string[];
    }
  ): Promise<{
    optimizedTitle: string;
    optimizedDescription: string;
    pricingSuggestion: string;
    missingAmenities: string[];
    contentScore: number;
  } | null> {
    if (!this.client || !this.checkRateLimit(userId)) {
      return null;
    }

    try {
      const prompt = `
Optimize this rental listing for better performance:

CURRENT LISTING:
Title: ${listingData.title}
Description: ${listingData.description}
Rent: ₹${listingData.rent}
Location: ${listingData.location}
Amenities: ${listingData.amenities.join(", ")}
Photo count: ${listingData.photos}

MARKET CONTEXT:
Average rent in area: ₹${marketData.averageRent}
Popular amenities: ${marketData.popularAmenities.join(", ")}
Competitor titles: ${marketData.competitorTitles.slice(0, 3).join(" | ")}

Provide optimization suggestions including improved title, description, pricing advice, and missing amenities.
Return as JSON with optimizedTitle, optimizedDescription, pricingSuggestion, missingAmenities, and contentScore (1-10).
      `;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a real estate content optimization expert. Provide specific, actionable improvements.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      const response = completion.choices[0]?.message?.content;
      return response ? JSON.parse(response) : null;
    } catch (error) {
      console.error("Listing optimization error:", error as unknown);
      return null;
    }
  }

  // NEW: Intelligent form parsing function
  async parseListingText(
    userId: string,
    rawText: string,
    sourceType: 'text' | 'facebook' = 'text'
  ): Promise<{
    formData: {
      title: string;
      propertyType: string;
      city: string;
      state: string;
      country: string;
      areaSqft: string;
      floor: string;
      description: string;
      highlights: string[];
      rent: string;
      maintenance: string;
      securityDeposit: string;
      expenses: string;
      flatmatePreferences: {
        gender: string;
        smoker: boolean;
        food: string;
        pets: boolean;
      };
      contactNumber: string;
    };
    extractedInfo: {
      confidence: number;
      extractedFields: string[];
      suggestedImprovements: string[];
      marketContext: string;
    };
  } | null> {
    if (!this.client) {
      console.warn('OpenAI not available, using fallback parsing');
      return this.getFallbackParsingResult(rawText);
    }

    if (!this.checkRateLimit(userId)) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    try {
      const prompt = this.buildListingParsePrompt(rawText, sourceType);

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert real estate listing parser. Extract information from rental property descriptions and convert them into structured form data. 
            
            Pay special attention to:
            - Indian property terminology (BHK, Flat, PG, etc.)
            - Indian currency formats (₹, lakhs, etc.)
            - Indian locations and landmarks
            - Common amenities and preferences
            - Contact information extraction
            
            Always return valid JSON with high confidence scores for accurately extracted fields.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.2, // Low temperature for accurate extraction
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const parsedResult = JSON.parse(response);
      
      // Store the parsing result for analytics
      await this.storeParsedDataForAnalytics(userId, rawText, parsedResult);
      
      return parsedResult;
      
    } catch (error) {
      console.error("OpenAI parsing error:", error);
      return this.getFallbackParsingResult(rawText);
    }
  }

  private buildListingParsePrompt(rawText: string, sourceType: string): string {
    return `
Extract rental property information from this ${sourceType === 'facebook' ? 'Facebook post' : 'text'} and convert it to structured form data:

TEXT TO PARSE:
"${rawText}"

Extract the following information and return as JSON:

{
  "formData": {
    "title": "Generated attractive title based on property details",
    "propertyType": "1BHK|2BHK|3BHK|Studio|Flat|PG|Other",
    "city": "City name (e.g., Bangalore, Mumbai, Delhi)",
    "state": "State name (e.g., Karnataka, Maharashtra, Delhi)",
    "country": "Country name (default: India)",
    "areaSqft": "Numerical value only (if found)",
    "floor": "Floor number only (if found)",
    "description": "Clean, professional description",
    "highlights": ["Array of amenities/features found"],
    "rent": "Monthly rent amount (numbers only, no currency)",
    "maintenance": "Maintenance amount (numbers only, if found)",
    "securityDeposit": "Security deposit amount (numbers only)",
    "expenses": "Description of additional expenses (if found)",
    "flatmatePreferences": {
      "gender": "Male|Female|Any (based on text)",
      "smoker": boolean,
      "food": "Veg|Non-Veg|Vegan|Any",
      "pets": boolean
    },
    "contactNumber": "Extracted phone number with +91 prefix if Indian"
  },
  "extractedInfo": {
    "confidence": 85, // 0-100 confidence score
    "extractedFields": ["List of successfully extracted fields"],
    "suggestedImprovements": ["Suggestions for missing or unclear information"],
    "marketContext": "Brief analysis of the property's market positioning"
  }
}

EXTRACTION RULES:
1. Convert currency mentions (₹, Rs, lakhs) to numerical values
2. Identify Indian property types (1BHK, 2BHK, etc.)
3. Extract location components separately: city (main city), state (Indian state), and country (default to India)
   - Common cities: Bangalore, Mumbai, Delhi, Pune, Hyderabad, Chennai, etc.
   - Common states: Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, etc.
4. Identify amenities from common Indian rental terms (furnished, AC, wifi, lift, parking, etc.)
5. Parse contact information (phone numbers, emails)
6. Infer flatmate preferences from text clues
7. Generate professional title if not explicitly provided
8. Ensure rent amount is realistic for Indian market (1000-200000 range typically)
9. Extract floor information from terms like "2nd floor", "ground floor"
10. Calculate security deposit if mentioned as "X months rent"

Return only valid JSON without any additional text.
    `;
  }

  private async storeParsedDataForAnalytics(userId: string, originalText: string, parsedResult: {
    formData: Record<string, unknown>;
    extractedInfo: {
      confidence: number;
      extractedFields: string[];
      suggestedImprovements: string[];
      marketContext: string;
    };
  }): Promise<void> {
    try {
      // Store in a simple format that can be used for analytics
      const analyticsEntry = {
        userId,
        timestamp: new Date().toISOString(),
        originalTextLength: originalText.length,
        extractedFieldsCount: parsedResult.extractedInfo?.extractedFields?.length || 0,
        confidence: parsedResult.extractedInfo?.confidence || 0,
        propertyType: parsedResult.formData?.propertyType || 'unknown',
        location: parsedResult.formData?.location || 'unknown',
        rent: parsedResult.formData?.rent ? parseInt(parsedResult.formData.rent as string) : 0,
        highlightsCount: Array.isArray(parsedResult.formData?.highlights) ? parsedResult.formData.highlights.length : 0,
        hasContact: !!parsedResult.formData?.contactNumber,
        source: 'ai_parsing'
      };

      // Store in localStorage for now (in production, you'd send to your analytics API)
      const existingData = localStorage.getItem('roomvia_parsing_analytics') || '[]';
      const analytics = JSON.parse(existingData);
      analytics.push(analyticsEntry);
      
      // Keep only last 1000 entries
      if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
      }
      
      localStorage.setItem('roomvia_parsing_analytics', JSON.stringify(analytics));
    } catch (error) {
      console.warn('Failed to store analytics data:', error);
    }
  }

  private getFallbackParsingResult(rawText: string): {
    formData: {
      title: string;
      propertyType: string;
      city: string;
      state: string;
      country: string;
      areaSqft: string;
      floor: string;
      description: string;
      highlights: string[];
      rent: string;
      maintenance: string;
      securityDeposit: string;
      expenses: string;
      flatmatePreferences: {
        gender: string;
        smoker: boolean;
        food: string;
        pets: boolean;
      };
      contactNumber: string;
    };
    extractedInfo: {
      confidence: number;
      extractedFields: string[];
      suggestedImprovements: string[];
      marketContext: string;
    };
  } {
    // Simple fallback parsing for when OpenAI is not available
    const words = rawText.toLowerCase().split(/\s+/);
    
    // Extract basic information using regex and keywords
    const rentMatch = rawText.match(/(?:₹|rs\.?|rupees?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    const phoneMatch = rawText.match(/(?:\+91|91)?[\s-]?[6-9]\d{9}/);
    const bhkMatch = rawText.match(/(\d+)\s*bhk/i);
    const floorMatch = rawText.match(/(\d+)(?:st|nd|rd|th)?\s*floor/i);
    const sqftMatch = rawText.match(/(\d+)\s*(?:sq\.?\s*ft|sqft|square\s*feet)/i);
    
    // Common amenities to look for
    const commonAmenities = ['furnished', 'ac', 'wifi', 'lift', 'parking', 'balcony', 'gym', 'security'];
    const foundAmenities = commonAmenities.filter(amenity => words.includes(amenity));
    
    // Extract location info
    const locationInfo = this.extractLocationFromText(rawText);
    const locationParts = locationInfo.split(',').map(part => part.trim());
    let city = '';
    let state = '';
    const country = 'India';
    
    if (locationParts.length >= 2) {
      city = locationParts[0];
      state = locationParts[1];
    } else if (locationParts.length === 1) {
      city = locationParts[0];
    }

    return {
      formData: {
        title: `Property in ${city || 'Unknown Location'}`,
        propertyType: bhkMatch ? `${bhkMatch[1]}BHK` : 'Flat',
        city: city,
        state: state,
        country: country,
        areaSqft: sqftMatch && sqftMatch[1] ? sqftMatch[1] : '',
        floor: floorMatch ? floorMatch[1] : '',
        description: rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''),
        highlights: foundAmenities.map(a => a.charAt(0).toUpperCase() + a.slice(1)),
        rent: rentMatch ? rentMatch[1].replace(/,/g, '') : '',
        maintenance: '',
        securityDeposit: rentMatch ? (parseInt(rentMatch[1].replace(/,/g, '')) * 2).toString() : '',
        expenses: '',
        flatmatePreferences: {
          gender: words.includes('male') ? 'Male' : words.includes('female') ? 'Female' : 'Any',
          smoker: words.includes('smoking') && !words.includes('non-smoking'),
          food: words.includes('veg') ? 'Veg' : 'Any',
          pets: words.includes('pet')
        },
        contactNumber: phoneMatch ? phoneMatch[0] : ''
      },
      extractedInfo: {
        confidence: 60, // Lower confidence for fallback
        extractedFields: ['title', 'propertyType', 'description'],
        suggestedImprovements: ['Add more specific details about amenities', 'Include exact location', 'Specify contact information'],
        marketContext: 'Basic information extracted using fallback parsing'
      }
    };
  }

  private extractLocationFromText(text: string): string {
    // Common Indian city patterns
    const cityPattern = /(bangalore|mumbai|delhi|pune|hyderabad|chennai|kolkata|ahmedabad|jaipur|lucknow|kanpur|nagpur|indore|bhopal|visakhapatnam|vadodara|firozabad|ludhiana|rajkot|agra|siliguri|durgapur|asansol|dhanbad|nanded|kolhapur|ajmer|jamnagar|ujjain|sangli|malegaon|gwalior)/i;
    const areaPattern = /(?:in|at|near|around)\s+([a-z\s]{2,30})(?:,|\.|$)/i;
    
    const cityMatch = text.match(cityPattern);
    const areaMatch = text.match(areaPattern);
    
    if (cityMatch && areaMatch) {
      return `${areaMatch[1].trim()}, ${cityMatch[1]}`;
    } else if (cityMatch) {
      return cityMatch[1];
    } else if (areaMatch) {
      return areaMatch[1].trim();
    }
    
    return 'Location not specified';
  }
}

// Singleton instance
export const openAIService = new OpenAIService();
