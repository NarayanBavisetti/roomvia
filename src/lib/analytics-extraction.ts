// Analytics data extraction utilities
export interface MarketInsight {
  property_type: string;
  search_count: number;
  avg_budget: number;
  male_preference: number;
  female_preference: number;
  gated_preference: number;
}

export interface TopFilter {
  filter_key: string;
  usage_count: number;
}

export interface EngagementStat {
  event_type: string;
  event_count: number;
  unique_users: number;
}

export interface MarketData {
  city: string;
  period_days: number;
  property_demand: MarketInsight[];
  top_filters: TopFilter[];
  engagement: EngagementStat[];
  generated_at: string;
}

export interface BrokerPost {
  id: string;
  title: string;
  property_type: string;
  city: string;
  rent: number;
  views: number;
  saves: number;
  messages: number;
  phone_reveals: number;
  created_at: string;
}

export interface BrokerPerformance {
  broker_id: string;
  period_days: number;
  summary: {
    total_listings: number;
    total_views: number;
    total_saves: number;
    total_messages: number;
    total_phone_reveals: number;
    avg_views_per_post: number;
  };
  posts: BrokerPost[];
  generated_at: string;
}

export interface AnalyticsResponse {
  data: MarketData | BrokerPerformance;
  ai_summary?: string;
  type: "market" | "performance";
  cached?: boolean;
  generated_at?: string;
}

// Track user behavior events
export const trackEvent = async (event: {
  event_type:
    | "search"
    | "filter_apply"
    | "listing_view"
    | "profile_view"
    | "save"
    | "message_sent"
    | "phone_reveal";
  city?: string;
  state?: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  filters_applied?: Record<string, unknown>;
  target_listing_id?: string;
  target_user_id?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
}) => {
  try {
    const { supabase } = await import("@/lib/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch("/api/analytics/insights", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token && {
          Authorization: `Bearer ${session.access_token}`,
        }),
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to track event:", error);
    return null;
  }
};

// Fetch analytics data
export const fetchAnalytics = async (params: {
  city?: string;
  days?: number;
  type: "market" | "performance";
}): Promise<AnalyticsResponse | null> => {
  try {
    const { supabase } = await import("@/lib/supabase");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Authentication required");
    }

    const searchParams = new URLSearchParams({
      type: params.type,
      ...(params.city && { city: params.city }),
      ...(params.days && { days: params.days.toString() }),
    });

    const response = await fetch(`/api/analytics/insights?${searchParams}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return null;
  }
};

// Format budget for display
export const formatBudget = (amount: number): string => {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}k`;
  }
  return `₹${amount}`;
};

// Calculate engagement rate
export const calculateEngagementRate = (post: BrokerPost): number => {
  const totalEngagements = post.saves + post.messages + post.phone_reveals;
  return post.views > 0 ? (totalEngagements / post.views) * 100 : 0;
};

// Get trend direction
export const getTrendDirection = (
  current: number,
  previous: number
): "up" | "down" | "stable" => {
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return "up";
  if (change < -5) return "down";
  return "stable";
};
