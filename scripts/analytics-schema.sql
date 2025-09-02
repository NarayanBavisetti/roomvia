-- Broker Analytics Database Schema
-- Run this in your Supabase SQL Editor

-- Search Analytics Table
CREATE TABLE search_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  search_query text,
  filters jsonb DEFAULT '{}',
  location text,
  property_type text,
  min_rent integer,
  max_rent integer,
  results_count integer DEFAULT 0,
  clicked_listings text[], -- Array of listing IDs clicked
  created_at timestamptz DEFAULT now()
);

-- Listing Performance Analytics
CREATE TABLE listing_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  broker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date date DEFAULT CURRENT_DATE,
  views integer DEFAULT 0,
  saves integer DEFAULT 0,
  inquiries integer DEFAULT 0,
  phone_reveals integer DEFAULT 0,
  shares integer DEFAULT 0,
  unique_visitors integer DEFAULT 0,
  average_time_spent interval DEFAULT '0 seconds',
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, date) -- One record per listing per day
);

-- User Behavior Tracking
CREATE TABLE user_behavior (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  listing_id uuid,
  event_type text NOT NULL, -- 'view', 'click', 'scroll', 'save', 'inquiry', 'phone_reveal'
  event_data jsonb DEFAULT '{}',
  page_url text,
  timestamp timestamptz DEFAULT now()
);

-- Market Trends Data
CREATE TABLE market_trends (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area text NOT NULL,
  property_type text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  avg_rent numeric(10,2),
  median_rent numeric(10,2),
  total_listings integer DEFAULT 0,
  active_listings integer DEFAULT 0,
  avg_days_to_rent numeric(5,1),
  popular_amenities text[],
  demand_score numeric(3,1), -- 1-10 scale
  created_at timestamptz DEFAULT now(),
  UNIQUE(area, property_type, date)
);

-- Broker Insights Cache (to avoid re-generating frequently)
CREATE TABLE broker_insights_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  insights_data jsonb NOT NULL,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  UNIQUE(broker_id)
);

-- Listing Optimization Suggestions
CREATE TABLE listing_optimizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL,
  broker_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  optimization_type text NOT NULL, -- 'pricing', 'content', 'photos', 'amenities'
  suggestion_data jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
  created_at timestamptz DEFAULT now(),
  applied_at timestamptz
);

-- Performance Benchmarks (for competitive analysis)
CREATE TABLE performance_benchmarks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  area text NOT NULL,
  property_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  avg_views_per_listing numeric(8,2),
  avg_inquiries_per_listing numeric(8,2),
  avg_conversion_rate numeric(5,3), -- percentage as decimal
  top_performing_amenities text[],
  avg_time_to_rent numeric(5,1),
  price_trend_percentage numeric(5,2),
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_search_analytics_user_id ON search_analytics(user_id);
CREATE INDEX idx_search_analytics_created_at ON search_analytics(created_at DESC);
CREATE INDEX idx_search_analytics_location ON search_analytics(location);

CREATE INDEX idx_listing_analytics_broker_id ON listing_analytics(broker_id);
CREATE INDEX idx_listing_analytics_listing_id ON listing_analytics(listing_id);
CREATE INDEX idx_listing_analytics_date ON listing_analytics(date DESC);

CREATE INDEX idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX idx_user_behavior_listing_id ON user_behavior(listing_id);
CREATE INDEX idx_user_behavior_event_type ON user_behavior(event_type);
CREATE INDEX idx_user_behavior_timestamp ON user_behavior(timestamp DESC);

CREATE INDEX idx_market_trends_area ON market_trends(area);
CREATE INDEX idx_market_trends_date ON market_trends(date DESC);

CREATE INDEX idx_broker_insights_cache_broker_id ON broker_insights_cache(broker_id);
CREATE INDEX idx_broker_insights_cache_expires_at ON broker_insights_cache(expires_at);

-- Row Level Security (RLS) Policies
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_insights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_optimizations ENABLE ROW LEVEL SECURITY;

-- Search analytics - users can only see their own data
CREATE POLICY "Users can view own search analytics" ON search_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow anonymous search tracking" ON search_analytics
  FOR INSERT WITH CHECK (true);

-- Listing analytics - brokers can only see their own listings
CREATE POLICY "Brokers can view own listing analytics" ON listing_analytics
  FOR ALL USING (auth.uid() = broker_id);

-- User behavior - allow tracking for all users
CREATE POLICY "Allow behavior tracking" ON user_behavior
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own behavior" ON user_behavior
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Broker insights cache - brokers can only access their own cache
CREATE POLICY "Brokers can access own insights" ON broker_insights_cache
  FOR ALL USING (auth.uid() = broker_id);

-- Listing optimizations - brokers can only see their own
CREATE POLICY "Brokers can access own optimizations" ON listing_optimizations
  FOR ALL USING (auth.uid() = broker_id);

-- Market trends and benchmarks are public read-only
CREATE POLICY "Public read market trends" ON market_trends
  FOR SELECT USING (true);

CREATE POLICY "Public read performance benchmarks" ON performance_benchmarks
  FOR SELECT USING (true);

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION get_broker_analytics(broker_user_id uuid, days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  WITH listing_stats AS (
    SELECT 
      COUNT(DISTINCT la.listing_id) as total_listings,
      SUM(la.views) as total_views,
      SUM(la.inquiries) as total_inquiries,
      SUM(la.saves) as total_saves,
      AVG(la.views) as avg_views_per_listing,
      AVG(la.inquiries) as avg_inquiries_per_listing,
      CASE WHEN SUM(la.views) > 0 THEN (SUM(la.inquiries)::float / SUM(la.views) * 100) ELSE 0 END as conversion_rate
    FROM listing_analytics la
    WHERE la.broker_id = broker_user_id
      AND la.date >= CURRENT_DATE - days_back
  ),
  search_trends AS (
    SELECT 
      array_agg(DISTINCT sa.search_query) FILTER (WHERE sa.search_query IS NOT NULL) as trending_searches,
      array_agg(DISTINCT sa.location) FILTER (WHERE sa.location IS NOT NULL) as popular_locations,
      array_agg(DISTINCT sa.property_type) FILTER (WHERE sa.property_type IS NOT NULL) as popular_types
    FROM search_analytics sa
    WHERE sa.created_at >= NOW() - (days_back || ' days')::interval
  )
  SELECT jsonb_build_object(
    'performance', row_to_json(listing_stats.*),
    'trends', row_to_json(search_trends.*),
    'generated_at', NOW()
  ) INTO result
  FROM listing_stats, search_trends;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track listing views
CREATE OR REPLACE FUNCTION track_listing_view(
  p_listing_id uuid,
  p_broker_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Update listing analytics
  INSERT INTO listing_analytics (listing_id, broker_id, views, unique_visitors)
  VALUES (p_listing_id, p_broker_id, 1, 1)
  ON CONFLICT (listing_id, date) DO UPDATE SET
    views = listing_analytics.views + 1,
    unique_visitors = listing_analytics.unique_visitors + 1;

  -- Track user behavior
  INSERT INTO user_behavior (user_id, session_id, listing_id, event_type)
  VALUES (p_user_id, p_session_id, p_listing_id, 'view');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track search behavior
CREATE OR REPLACE FUNCTION track_search(
  p_user_id uuid DEFAULT NULL,
  p_session_id text,
  p_search_query text DEFAULT NULL,
  p_filters jsonb DEFAULT '{}',
  p_location text DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_rent integer DEFAULT NULL,
  p_max_rent integer DEFAULT NULL,
  p_results_count integer DEFAULT 0
) RETURNS void AS $$
BEGIN
  INSERT INTO search_analytics (
    user_id, session_id, search_query, filters, location, 
    property_type, min_rent, max_rent, results_count
  ) VALUES (
    p_user_id, p_session_id, p_search_query, p_filters, p_location,
    p_property_type, p_min_rent, p_max_rent, p_results_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for analytics tables (optional)
-- ALTER publication supabase_realtime ADD TABLE listing_analytics;
-- ALTER publication supabase_realtime ADD TABLE user_behavior;