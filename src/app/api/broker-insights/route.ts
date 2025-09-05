import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { geminiService } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Bangalore";
    const days = parseInt(searchParams.get("days") || "7");
    const useTestData = searchParams.get("test") === "true";

    // Use service role for broker insights to bypass RLS if available
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

    const supabase = serviceKey
      ? createClient(supabaseUrl, serviceKey) // Service role bypasses RLS
      : createRouteHandlerClient({ cookies: cookies }); // Regular client for auth

    console.log("Using service role:", !!serviceKey);

    let session = null;
    let sessionError = null;

    // Only check authentication if not using service role
    if (!serviceKey) {
      console.log("Checking user authentication...");
      console.log("Headers:", request.headers.get("cookie"));
      console.log("Authorization:", request.headers.get("authorization"));

      const authResult = await supabase.auth.getSession();
      session = authResult.data?.session;
      sessionError = authResult.error;

      console.log("Session check:", {
        session: !!session,
        userId: session?.user?.id,
        error: sessionError,
        hasAccessToken: !!session?.access_token,
      });
    } else {
      console.log(
        "Skipping auth check - using service role for broker insights"
      );
    }

    if (!serviceKey && !session?.user) {
      console.log("No session found, user not authenticated");

      // For development, allow unauthenticated access with mock data
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Development mode: allowing unauthenticated access with mock data"
        );

        // If test=true is passed, use sample data to demonstrate Gemini
        if (useTestData) {
          console.log("Using test data to demonstrate Gemini capabilities");
          return await handleTestDataRequest(city, days);
        }

        // Create mock insights for demonstration
        return NextResponse.json({
          success: true,
          data: {
            insights: {
              totalSearches: 0,
              uniqueUsers: 0,
              propertyTypeDistribution: [],
              priceRanges: {
                "< ₹15k": 0,
                "₹15k-25k": 0,
                "₹25k-40k": 0,
                "> ₹40k": 0,
              },
              popularAmenities: [],
              locationPreferences: [],
            },
            ai_summary: `# No Data Available for ${city}

## 📊 DEMO MODE

**Note:** This is a demonstration of the broker insights feature. No user search data is available yet.

**To see real insights:**
• Users need to search for properties in ${city}
• Filter data will be collected automatically
• Real market analysis will be generated based on actual user behavior

**Expected Insights Include:**
• Property type demand analysis
• Price range preferences
• Popular amenities and features
• Location preferences and trends
• Strategic recommendations for brokers

*Please ensure you're logged in and there's user search data available for meaningful insights.*

**To test Gemini integration:** Add \`&test=true\` to the URL`,
            recommendations: [
              "Set up user authentication to access real insights",
              "Encourage users to search for properties to generate data",
              "Check back once there are active searches in your target city",
              "Add &test=true to URL to test Gemini integration with sample data",
            ],
            confidence: 0.5,
            fallback_used: true,
            metadata: {
              city,
              days,
              totalFilters: 0,
              analysisDate: new Date().toISOString(),
              analysis_type: "demo_mode",
            },
          },
        });
      }

      return NextResponse.json(
        {
          error: "Unauthorized - Please log in to access broker insights",
          details: "Session not found or invalid",
        },
        { status: 401 }
      );
    }

    // Check if user is a broker (skip if using service role)
    let profile = null;
    let profileError = null;

    if (!serviceKey && session?.user) {
      const profileResult = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", session.user.id)
        .single();

      profile = profileResult.data;
      profileError = profileResult.error;
    } else if (serviceKey) {
      console.log("Skipping broker profile check - using service role");
    }

    console.log("Profile check:", {
      profile,
      profileError,
      userId: session?.user?.id || "service-role",
      accountType: profile?.account_type,
    });

    if (profileError) {
      console.error("Profile query error:", profileError);
      // Allow access even if profile doesn't exist or has errors for now
      // return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // For debugging, allow any authenticated user for now
    // TODO: Re-enable broker check once profiles are properly set up
    // if (profile?.account_type !== 'broker') {
    //   return NextResponse.json({ error: 'Broker access required' }, { status: 403 })
    // }

    // Get user filter data for the specified city and time period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    console.log(
      `Fetching filter data for ${city} from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const { data: filterData, error: filterError } = await supabase
      .from("user_search_filters")
      .select(
        `
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
      `
      )
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString())
      .order("usage_count", { ascending: false });

    if (filterError) {
      console.error("Filter data query error:", filterError);
      return NextResponse.json(
        { error: "Failed to fetch filter data" },
        { status: 500 }
      );
    }

    console.log(`Found ${filterData?.length || 0} filter records`);

    // If no filter data, try to use listing data as a proxy for market demand
    let insights;
    if (!filterData || filterData.length === 0) {
      console.log("No filter data found, analyzing listing data instead...");
      insights = await analyzeListingData(supabase, city, days);
    } else {
      // Aggregate the data for insights
      insights = analyzeFilterData(filterData || [], city, days);
    }

    // Generate AI insights using Gemini with fallback
    let aiResult = null;
    let fallbackUsed = false;
    let analysisType = "listing_based";

    try {
      const aiPrompt = createInsightPrompt(
        insights,
        city,
        days,
        filterData?.length === 0
      );
      console.log("Attempting to generate AI insights with Gemini");

      aiResult = await geminiService.generateInsights(
        session?.user?.id || "service-role-user",
        aiPrompt
      );
      analysisType =
        filterData?.length === 0 ? "listing_ai_analysis" : "filter_ai_analysis";
    } catch (error: unknown) {
      console.log(
        "Gemini failed, using fallback insights:",
        error instanceof Error ? error.message : "Unknown error"
      );
      fallbackUsed = true;

      // Generate fallback insights
      aiResult = generateFallbackInsights(insights, city, days);
      analysisType =
        filterData?.length === 0 ? "listing_statistical" : "filter_statistical";
    }

    if (!aiResult) {
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        insights,
        ai_summary: aiResult.content,
        recommendations: aiResult.recommendations,
        confidence: aiResult.confidence,
        fallback_used: fallbackUsed,
        metadata: {
          city,
          days,
          totalFilters: filterData?.length || 0,
          analysisDate: new Date().toISOString(),
          analysis_type: analysisType,
          data_source: filterData?.length === 0 ? "listings" : "user_filters",
          note:
            filterData?.length === 0
              ? "Analysis based on recent listing data"
              : "Analysis based on user search filters",
        },
      },
    });
  } catch (error) {
    console.error("Broker insights API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Analyze listing data as a proxy for market supply/demand
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function analyzeListingData(supabase: any, city: string, days: number) {
  console.log("Analyzing listing data for market insights...");

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: listings, error } = await supabase
    .from("listings")
    .select(
      `
      id,
      property_type,
      city,
      area,
      rent,
      highlights,
      created_at
    `
    )
    .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Listing data query error:", error);
    return {
      totalSearches: 0,
      uniqueUsers: 0,
      propertyTypeDistribution: [],
      priceRanges: {},
      popularAmenities: [],
      locationPreferences: [],
      searchTrends: {},
    };
  }

  console.log(`Found ${listings?.length || 0} recent listings`);

  if (!listings || listings.length === 0) {
    return {
      totalSearches: 0,
      uniqueUsers: 0,
      propertyTypeDistribution: [],
      priceRanges: {},
      popularAmenities: [],
      locationPreferences: [],
      searchTrends: {},
    };
  }

  // Analyze listings as market supply indicators
  const totalListings = listings.length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueAreas = new Set(listings.map((l: any) => l.area)).size;

  // Property type distribution from listings
  const propertyTypes: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings.forEach((listing: any) => {
    if (listing.property_type) {
      propertyTypes[listing.property_type] =
        (propertyTypes[listing.property_type] || 0) + 1;
    }
  });

  const propertyTypeDistribution = Object.entries(propertyTypes)
    .map(([type, count]) => ({ property_type: type, search_count: count }))
    .sort((a, b) => b.search_count - a.search_count);

  // Price range analysis from listings
  const priceRanges = {
    "< ₹15k": 0,
    "₹15k-25k": 0,
    "₹25k-40k": 0,
    "> ₹40k": 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings.forEach((listing: any) => {
    const rent = listing.rent || 0;

    if (rent < 15000) {
      priceRanges["< ₹15k"] += 1;
    } else if (rent <= 25000) {
      priceRanges["₹15k-25k"] += 1;
    } else if (rent <= 40000) {
      priceRanges["₹25k-40k"] += 1;
    } else {
      priceRanges["> ₹40k"] += 1;
    }
  });

  // Popular amenities from listings
  const amenityCount: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings.forEach((listing: any) => {
    if (listing.highlights && Array.isArray(listing.highlights)) {
      listing.highlights.forEach((highlight: string) => {
        amenityCount[highlight] = (amenityCount[highlight] || 0) + 1;
      });
    }
  });

  const popularAmenities = Object.entries(amenityCount)
    .map(([amenity, count]) => ({ amenity, usage_count: count }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);

  // Location preferences from listings
  const locationCount: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings.forEach((listing: any) => {
    if (listing.area) {
      locationCount[listing.area] = (locationCount[listing.area] || 0) + 1;
    }
  });

  const locationPreferences = Object.entries(locationCount)
    .map(([location, count]) => ({ area: location, search_count: count }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, 15);

  // Listing trends by day
  const listingTrends: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings.forEach((listing: any) => {
    const date = new Date(listing.created_at).toDateString();
    listingTrends[date] = (listingTrends[date] || 0) + 1;
  });

  return {
    totalSearches: totalListings, // Using listings as proxy for market activity
    uniqueUsers: uniqueAreas, // Using unique areas as proxy for market reach
    propertyTypeDistribution,
    priceRanges,
    popularAmenities,
    locationPreferences,
    searchTrends: listingTrends,
  };
}

// Analyze filter data and extract insights
function analyzeFilterData(
  filterData: Array<{
    id: string;
    user_id: string;
    city?: string;
    state?: string;
    area?: string;
    property_type?: string;
    min_rent?: number;
    max_rent?: number;
    amenities?: string[];
    filters?: Record<string, unknown>;
    usage_count?: number;
    last_used: string;
  }>,
  _city: string,
  _days: number
) {
  // Mark parameters as intentionally unused to satisfy linter
  void _city;
  void _days;
  if (!filterData || filterData.length === 0) {
    return {
      totalSearches: 0,
      uniqueUsers: 0,
      propertyTypeDistribution: [],
      priceRanges: {},
      popularAmenities: [],
      locationPreferences: [],
      searchTrends: {},
    };
  }

  // Basic statistics
  const totalSearches = filterData.reduce(
    (sum, item) => sum + (item.usage_count || 1),
    0
  );
  const uniqueUsers = new Set(filterData.map((item) => item.user_id)).size;

  // Property type distribution
  const propertyTypes: { [key: string]: number } = {};
  filterData.forEach((item) => {
    if (item.property_type) {
      propertyTypes[item.property_type] =
        (propertyTypes[item.property_type] || 0) + (item.usage_count || 1);
    }
  });

  const propertyTypeDistribution = Object.entries(propertyTypes)
    .map(([type, count]) => ({ property_type: type, search_count: count }))
    .sort((a, b) => b.search_count - a.search_count);

  // Price range analysis
  const priceRanges = {
    "< ₹15k": 0,
    "₹15k-25k": 0,
    "₹25k-40k": 0,
    "> ₹40k": 0,
  };

  filterData.forEach((item) => {
    const maxRent = item.max_rent || item.min_rent || 0;
    const count = item.usage_count || 1;

    if (maxRent < 15000) {
      priceRanges["< ₹15k"] += count;
    } else if (maxRent <= 25000) {
      priceRanges["₹15k-25k"] += count;
    } else if (maxRent <= 40000) {
      priceRanges["₹25k-40k"] += count;
    } else {
      priceRanges["> ₹40k"] += count;
    }
  });

  // Popular amenities
  const amenityCount: { [key: string]: number } = {};
  filterData.forEach((item) => {
    if (item.amenities && Array.isArray(item.amenities)) {
      item.amenities.forEach((amenity: string) => {
        amenityCount[amenity] =
          (amenityCount[amenity] || 0) + (item.usage_count || 1);
      });
    }

    // Also check filters JSON for amenities
    if (item.filters && typeof item.filters === "object") {
      const filters = item.filters as Record<string, unknown>;
      if (filters.furnishing && Array.isArray(filters.furnishing)) {
        (filters.furnishing as string[]).forEach((f: string) => {
          amenityCount[f] = (amenityCount[f] || 0) + (item.usage_count || 1);
        });
      }
    }
  });

  const popularAmenities = Object.entries(amenityCount)
    .map(([amenity, count]) => ({ amenity, usage_count: count }))
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, 10);

  // Location preferences
  const locationCount: { [key: string]: number } = {};
  filterData.forEach((item) => {
    if (item.area) {
      locationCount[item.area] =
        (locationCount[item.area] || 0) + (item.usage_count || 1);
    }
  });

  const locationPreferences = Object.entries(locationCount)
    .map(([location, count]) => ({ area: location, search_count: count }))
    .sort((a, b) => b.search_count - a.search_count)
    .slice(0, 15);

  // Search trends by day
  const searchTrends: { [key: string]: number } = {};
  filterData.forEach((item) => {
    const date = new Date(item.last_used).toDateString();
    searchTrends[date] = (searchTrends[date] || 0) + (item.usage_count || 1);
  });

  return {
    totalSearches,
    uniqueUsers,
    propertyTypeDistribution,
    priceRanges,
    popularAmenities,
    locationPreferences,
    searchTrends,
  };
}

// Create prompt for AI insights generation
function createInsightPrompt(
  insights: {
    totalSearches: number;
    uniqueUsers: number;
    propertyTypeDistribution: Array<{
      property_type: string;
      search_count: number;
    }>;
    priceRanges: Record<string, number>;
    popularAmenities: Array<{ amenity: string; usage_count: number }>;
    locationPreferences: Array<{ area: string; search_count: number }>;
  },
  city: string,
  days: number,
  isListingBased: boolean = false
): string {
  const dataType = isListingBased ? "listing supply data" : "user search data";
  const contextNote = isListingBased
    ? "Note: This analysis is based on recent property listings, indicating market supply patterns."
    : "Note: This analysis is based on user search behavior, indicating market demand patterns.";

  return `Analyze the following real estate ${dataType} for ${city} over the last ${days} days and provide actionable broker insights:

${contextNote}

SEARCH STATISTICS:
- Total Searches: ${insights.totalSearches}
- Unique Users: ${insights.uniqueUsers}
- Average searches per user: ${
    insights.uniqueUsers > 0
      ? (insights.totalSearches / insights.uniqueUsers).toFixed(1)
      : 0
  }

PROPERTY TYPE DEMAND:
${insights.propertyTypeDistribution
  .map((item) => `- ${item.property_type}: ${item.search_count} searches`)
  .join("\n")}

PRICE RANGE PREFERENCES:
${Object.entries(insights.priceRanges)
  .map(([range, count]) => `- ${range}: ${count} searches`)
  .join("\n")}

TOP AMENITIES SEARCHED:
${insights.popularAmenities
  .slice(0, 8)
  .map(
    (item, index) => `${index + 1}. ${item.amenity}: ${item.usage_count} times`
  )
  .join("\n")}

TOP LOCATION PREFERENCES:
${insights.locationPreferences
  .slice(0, 8)
  .map(
    (item, index) => `${index + 1}. ${item.area}: ${item.search_count} searches`
  )
  .join("\n")}

Please provide:

1. **MARKET DEMAND ANALYSIS**: What property types and price ranges are in highest demand?

2. **LOCATION INSIGHTS**: Which areas should brokers focus on?

3. **PRICING RECOMMENDATIONS**: What rent ranges are most popular for different property types?

4. **TENANT PREFERENCES**: What amenities do tenants value most?

5. **STRATEGIC RECOMMENDATIONS**: 3-4 specific actionable recommendations for brokers to increase their success rate.

Format your response with clear sections and bullet points. Focus on practical, data-driven insights that brokers can act upon immediately.`;
}

// Generate fallback insights when Gemini is unavailable
function generateFallbackInsights(
  insights: {
    totalSearches: number;
    uniqueUsers: number;
    propertyTypeDistribution: Array<{
      property_type: string;
      search_count: number;
    }>;
    priceRanges: Record<string, number>;
    popularAmenities: Array<{ amenity: string; usage_count: number }>;
    locationPreferences: Array<{ area: string; search_count: number }>;
  },
  city: string,
  days: number
) {
  const topPropertyType =
    insights.propertyTypeDistribution[0]?.property_type || "N/A";
  const topLocation = insights.locationPreferences[0]?.area || "N/A";
  const topAmenity = insights.popularAmenities[0]?.amenity || "N/A";

  // Find most popular price range
  const topPriceRange =
    Object.entries(insights.priceRanges).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0] || "N/A";

  const avgSearchesPerUser =
    insights.uniqueUsers > 0
      ? (insights.totalSearches / insights.uniqueUsers).toFixed(1)
      : "0";

  const fallbackContent = `# Market Analysis for ${city} (${days} days)

## 📊 MARKET DEMAND ANALYSIS

**Property Type Trends:**
• ${topPropertyType} is the most searched property type with ${
    insights.propertyTypeDistribution[0]?.search_count || 0
  } searches
• Total of ${
    insights.propertyTypeDistribution.length
  } different property types in demand
• Market shows ${
    insights.totalSearches > 100
      ? "high"
      : insights.totalSearches > 50
      ? "moderate"
      : "low"
  } search activity

**Budget Range Preferences:**
• ${topPriceRange} is the most popular budget range
• Price distribution shows ${
    Object.keys(insights.priceRanges).length
  } active price segments
• Market accessibility varies across different income groups

## 🗺️ LOCATION INSIGHTS

**Area Demand:**
• ${topLocation} leads with ${
    insights.locationPreferences[0]?.search_count || 0
  } searches
• ${insights.locationPreferences.length} different areas showing search activity
• Location preferences indicate ${
    insights.locationPreferences.length > 10 ? "diverse" : "concentrated"
  } market demand

**Geographic Distribution:**
• Search activity spread across ${insights.locationPreferences.length} locations
• Top 3 areas account for ${insights.locationPreferences
    .slice(0, 3)
    .reduce((sum, item) => sum + item.search_count, 0)} searches

## 💰 PRICING RECOMMENDATIONS

**Rent Optimization:**
• Focus on ${topPriceRange} segment for maximum market reach
• Consider ${insights.propertyTypeDistribution
    .slice(0, 2)
    .map((p) => p.property_type)
    .join(" and ")} properties for best demand
• Price competitively within popular ranges to attract more inquiries

## 🏠 TENANT PREFERENCES

**Amenity Priorities:**
• ${topAmenity} is the most requested feature (${
    insights.popularAmenities[0]?.usage_count || 0
  } searches)
• Top 5 amenities: ${insights.popularAmenities
    .slice(0, 5)
    .map((a) => a.amenity)
    .join(", ")}
• Focus on essential amenities to differentiate listings

## 🎯 STRATEGIC RECOMMENDATIONS

**1. Market Positioning:**
• Target ${topPropertyType} properties in ${topLocation} area
• Price competitively in ${topPriceRange} range for maximum visibility
• Emphasize ${topAmenity} and other top amenities in listings

**2. Inventory Focus:**
• Prioritize ${insights.propertyTypeDistribution
    .slice(0, 2)
    .map((p) => p.property_type)
    .join(" and ")} property types
• Consider expanding to ${insights.locationPreferences
    .slice(1, 3)
    .map((l) => l.area)
    .join(" and ")} for growth opportunities

**3. Marketing Strategy:**
• Highlight ${insights.popularAmenities
    .slice(0, 3)
    .map((a) => a.amenity)
    .join(", ")} in property descriptions
• Focus advertising efforts in ${insights.locationPreferences
    .slice(0, 3)
    .map((l) => l.area)
    .join(", ")}

**4. Competitive Advantage:**
• With ${
    insights.uniqueUsers
  } active users and ${avgSearchesPerUser} searches per user, market shows ${
    insights.totalSearches > 100 ? "high engagement" : "growth potential"
  }
• Focus on quick response times as users are actively searching

---
*Analysis based on ${insights.totalSearches} searches from ${
    insights.uniqueUsers
  } unique users over ${days} days in ${city}.*

**Note:** This analysis was generated using statistical insights due to temporary AI service limitations. Contact support if you need detailed AI-powered recommendations.`;

  const recommendations = [
    `Focus on ${topPropertyType} properties as they show highest demand`,
    `Prioritize listings in ${topLocation} area for maximum visibility`,
    `Emphasize ${topAmenity} in property descriptions and marketing`,
    `Price competitively within ${topPriceRange} range to attract more inquiries`,
    `Consider expanding inventory to ${
      insights.locationPreferences[1]?.area || "emerging areas"
    } for growth`,
  ];

  return {
    content: fallbackContent,
    confidence: 0.75, // Lower confidence for fallback
    recommendations: recommendations.filter(
      (r) => !r.includes("undefined") && !r.includes("N/A")
    ),
  };
}

// Handle test data request to demonstrate Gemini integration
async function handleTestDataRequest(city: string, days: number) {
  console.log("Generating test insights with sample data");

  // Create realistic sample insights data based on actual listings
  const sampleInsights = {
    totalSearches: 45,
    uniqueUsers: 18,
    propertyTypeDistribution: [
      { property_type: "2BHK", search_count: 18 },
      { property_type: "3BHK", search_count: 12 },
      { property_type: "1BHK", search_count: 10 },
      { property_type: "Other", search_count: 5 },
    ],
    priceRanges: {
      "< ₹15k": 8,
      "₹15k-25k": 15,
      "₹25k-40k": 14,
      "> ₹40k": 8,
    },
    popularAmenities: [
      { amenity: "Furnished", usage_count: 28 },
      { amenity: "AC", usage_count: 24 },
      { amenity: "Parking", usage_count: 22 },
      { amenity: "WiFi", usage_count: 18 },
      { amenity: "Security", usage_count: 16 },
      { amenity: "Backup", usage_count: 12 },
      { amenity: "Lift", usage_count: 10 },
    ],
    locationPreferences: [
      { area: "Hi-Tech City", search_count: 14 },
      { area: "Gachibowli", search_count: 12 },
      { area: "Kondapur", search_count: 8 },
      { area: "Madhapur", search_count: 7 },
      { area: "Miyapur", search_count: 4 },
    ],
  };

  // Generate AI insights using Gemini with sample data
  let aiResult = null;
  let fallbackUsed = false;

  try {
    const aiPrompt = createInsightPrompt(sampleInsights, city, days);
    console.log(
      "Attempting to generate AI insights with Gemini using sample data"
    );

    // Use a fake user ID for testing
    aiResult = await geminiService.generateInsights("test-user-id", aiPrompt);
    console.log("✅ Gemini AI insights generated successfully!");
  } catch (error: unknown) {
    console.log(
      "❌ Gemini failed, using fallback insights:",
      error instanceof Error ? error.message : "Unknown error"
    );
    fallbackUsed = true;

    // Generate fallback insights
    aiResult = generateFallbackInsights(sampleInsights, city, days);
  }

  if (!aiResult) {
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      insights: sampleInsights,
      ai_summary: aiResult.content,
      recommendations: aiResult.recommendations,
      confidence: aiResult.confidence,
      fallback_used: fallbackUsed,
      metadata: {
        city,
        days,
        totalFilters: 45,
        analysisDate: new Date().toISOString(),
        analysis_type: fallbackUsed ? "statistical_test" : "ai_powered_test",
        note: "This is test data to demonstrate Gemini integration with realistic market data",
      },
    },
  });
}
