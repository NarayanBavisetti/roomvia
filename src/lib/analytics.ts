import { supabase } from "./supabase";

// Types for analytics tracking
export interface SearchFilters {
  propertyType?: string;
  minRent?: number;
  maxRent?: number;
  amenities?: string[];
  location?: string;
  [key: string]: string | number | string[] | undefined;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
}

// Analytics tracking service
class AnalyticsService {
  private sessionId: string;
  private userId?: string;
  private pageStartTime: number = Date.now();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private async initializeSession() {
    // Get current user if authenticated
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      this.userId = user?.id;
    } catch (error) {
      console.warn("Failed to get user for analytics:", error);
    }
  }

  // Track search behavior
  async trackSearch(
    searchQuery?: string,
    filters: SearchFilters = {},
    resultsCount: number = 0
  ): Promise<void> {
    try {
      // Persist user filters for analytics
      try {
        await supabase.rpc("upsert_user_search_filter", {
          p_user_id: this.userId || null,
          p_session_id: this.sessionId,
          p_filters: filters as Record<string, unknown>,
          p_city: (filters.location as string) || null,
          p_state: (filters as Record<string, unknown>).state || null,
          p_area: (filters as Record<string, unknown>).area || null,
          p_property_type: (filters.propertyType as string) || null,
          p_min_rent: (filters.minRent as number) || null,
          p_max_rent: (filters.maxRent as number) || null,
          p_amenities: (filters.amenities as string[]) || null,
        });
      } catch (e) {
        console.warn("Failed to upsert user filter:", e);
      }

      await supabase.rpc("track_search", {
        p_user_id: this.userId || null,
        p_session_id: this.sessionId,
        p_search_query: searchQuery || null,
        p_filters: filters,
        p_location: filters.location || null,
        p_property_type: filters.propertyType || null,
        p_min_rent: filters.minRent || null,
        p_max_rent: filters.maxRent || null,
        p_results_count: resultsCount,
      });
    } catch (error) {
      console.error("Failed to track search:", error);
    }
  }

  // Track listing views
  async trackListingView(listingId: string, brokerId: string): Promise<void> {
    try {
      await supabase.rpc("track_listing_view", {
        p_listing_id: listingId,
        p_broker_id: brokerId,
        p_user_id: this.userId || null,
        p_session_id: this.sessionId,
      });
    } catch (error) {
      console.error("Failed to track listing view:", error);
    }
  }

  // Track user behavior events
  async trackEvent(
    eventType:
      | "click"
      | "scroll"
      | "save"
      | "inquiry"
      | "phone_reveal"
      | "share",
    listingId?: string,
    eventData: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await supabase.from("user_behavior").insert({
        user_id: this.userId || null,
        session_id: this.sessionId,
        listing_id: listingId || null,
        event_type: eventType,
        event_data: eventData,
        page_url: typeof window !== "undefined" ? window.location.href : null,
      });
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  }

  // Track time spent on page
  trackPageView(pageType: string, pageId?: string): () => void {
    this.pageStartTime = Date.now();

    // Return cleanup function to track duration
    return () => {
      const duration = Date.now() - this.pageStartTime;
      this.trackEvent("scroll", pageId, {
        page_type: pageType,
        duration_ms: duration,
      });
    };
  }

  // Get broker analytics data
  async getBrokerAnalytics(
    brokerId: string,
    daysBack: number = 30
  ): Promise<BrokerAnalyticsResult | null> {
    try {
      const { data, error } = await supabase.rpc("get_broker_analytics", {
        broker_user_id: brokerId,
        days_back: daysBack,
      });

      if (error) throw error;
      return data as BrokerAnalyticsResult;
    } catch (error) {
      console.error("Failed to get broker analytics:", error);
      return null;
    }
  }

  // Get detailed listing analytics
  async getListingAnalytics(
    brokerId: string,
    daysBack: number = 30
  ): Promise<ListingAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from("listing_analytics")
        .select(
          `
          *,
          listing:listing_id (
            title,
            location,
            rent,
            property_type,
            status
          )
        `
        )
        .eq("broker_id", brokerId)
        .gte(
          "date",
          new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        )
        .order("date", { ascending: false });

      if (error) throw error;
      return (data || []) as ListingAnalytics[];
    } catch (error) {
      console.error("Failed to get listing analytics:", error);
      return [];
    }
  }

  // Get search trends
  async getSearchTrends(daysBack: number = 30): Promise<SearchTrends> {
    try {
      const { data, error } = await supabase
        .from("search_analytics")
        .select("search_query, location, property_type, min_rent, max_rent")
        .gte(
          "created_at",
          new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
        )
        .not("search_query", "is", null);

      if (error) throw error;

      const initial: SearchTrends = {
        keywords: [],
        locations: [],
        propertyTypes: [],
        priceRanges: [],
      };

      const trends = (data || []).reduce(
        (acc: SearchTrends, search: SearchRow) => {
          if (search.search_query) {
            acc.keywords.push(search.search_query.toLowerCase());
          }
          if (search.location) {
            acc.locations.push(search.location);
          }
          if (search.property_type) {
            acc.propertyTypes.push(search.property_type);
          }
          if (search.min_rent && search.max_rent) {
            acc.priceRanges.push({
              min: search.min_rent,
              max: search.max_rent,
              count: 1,
            });
          }
          return acc;
        },
        initial
      );

      // Get unique values and count frequencies
      return {
        keywords: [...new Set(trends.keywords)].slice(0, 20),
        locations: [...new Set(trends.locations)].slice(0, 10),
        propertyTypes: [...new Set(trends.propertyTypes)],
        priceRanges: this.groupPriceRanges(trends.priceRanges),
      };
    } catch (error) {
      console.error("Failed to get search trends:", error);
      return {
        keywords: [],
        locations: [],
        propertyTypes: [],
        priceRanges: [],
      };
    }
  }

  private groupPriceRanges(
    ranges: { min: number; max: number }[]
  ): { min: number; max: number; count: number }[] {
    const groups: Record<string, { min: number; max: number; count: number }> =
      {};

    ranges.forEach((range) => {
      const key = `${range.min}-${range.max}`;
      if (groups[key]) {
        groups[key].count++;
      } else {
        groups[key] = { min: range.min, max: range.max, count: 1 };
      }
    });

    return Object.values(groups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // Get market trends for specific area
  async getMarketTrends(area?: string): Promise<MarketTrend[]> {
    try {
      let query = supabase
        .from("market_trends")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (area) {
        query = query.eq("area", area);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as MarketTrend[];
    } catch (error) {
      console.error("Failed to get market trends:", error);
      return [];
    }
  }

  // Cache or retrieve broker insights
  async getBrokerInsights(
    brokerId: string,
    forceRefresh: boolean = false
  ): Promise<BrokerInsightsCacheData | null> {
    try {
      if (!forceRefresh) {
        // Check cache first
        const { data: cached, error: cacheError } = await supabase
          .from("broker_insights_cache")
          .select("insights_data, expires_at")
          .eq("broker_id", brokerId)
          .single();

        if (!cacheError && cached && new Date(cached.expires_at) > new Date()) {
          return cached.insights_data as BrokerInsightsCacheData;
        }
      }

      // Generate new insights (this would typically call the OpenAI service)
      const analyticsData = await this.getBrokerAnalytics(brokerId);
      const searchTrends = await this.getSearchTrends();
      const marketTrends = await this.getMarketTrends();

      const insightsData: BrokerInsightsCacheData = {
        analytics: analyticsData,
        searchTrends,
        marketTrends,
        generatedAt: new Date().toISOString(),
      };

      // Cache the insights
      await supabase.from("broker_insights_cache").upsert({
        broker_id: brokerId,
        insights_data: insightsData,
        generated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      return insightsData;
    } catch (error) {
      console.error("Failed to get broker insights:", error);
      return null;
    }
  }

  // Update user session when user logs in/out
  updateUserSession(userId?: string) {
    this.userId = userId;
  }

  // Get current session info
  getSessionInfo(): UserSession {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Types exported for consumers
export interface BrokerAnalyticsResult {
  performance?: {
    totalViews: number;
    totalInquiries: number;
    totalListings: number;
    conversionRate: number;
  };
}

export interface ListingAnalytics {
  listing_id: string;
  views: number;
  saves: number;
  inquiries: number;
  phone_reveals?: number;
  date?: string;
  listing?: {
    title?: string;
    location?: string;
    rent?: number;
    property_type?: string;
    status?: string;
  };
}

export interface SearchRow {
  search_query?: string | null;
  location?: string | null;
  property_type?: string | null;
  min_rent?: number | null;
  max_rent?: number | null;
}

export interface SearchTrends {
  keywords: string[];
  locations: string[];
  propertyTypes: string[];
  priceRanges: { min: number; max: number; count: number }[];
}

export interface MarketTrend {
  area: string;
  demand_score: number;
  avg_rent: number;
  popular_amenities: string[];
}

export interface BrokerInsightsCacheData {
  analytics: BrokerAnalyticsResult | null;
  searchTrends: SearchTrends;
  marketTrends: MarketTrend[];
  generatedAt: string;
}

// React hook for analytics
export function useAnalytics() {
  const trackSearch = (
    query?: string,
    filters?: SearchFilters,
    resultCount?: number
  ) => {
    analyticsService.trackSearch(query, filters, resultCount);
  };

  const trackListingView = (listingId: string, brokerId: string) => {
    analyticsService.trackListingView(listingId, brokerId);
  };

  const trackEvent = (
    eventType:
      | "click"
      | "scroll"
      | "save"
      | "inquiry"
      | "phone_reveal"
      | "share",
    listingId?: string,
    data?: Record<string, unknown>
  ) => {
    analyticsService.trackEvent(eventType, listingId, data);
  };

  const trackPageView = (pageType: string, pageId?: string) => {
    return analyticsService.trackPageView(pageType, pageId);
  };

  return {
    trackSearch,
    trackListingView,
    trackEvent,
    trackPageView,
    sessionInfo: analyticsService.getSessionInfo(),
  };
}
