-- Analytics schema for broker dashboard
-- Tracks user behavior and engagement for insights

-- User behavior tracking table
CREATE TABLE user_behavior (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('search', 'filter_apply', 'listing_view', 'profile_view', 'save', 'message_sent', 'phone_reveal')),
  city TEXT,
  state TEXT,
  property_type TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  filters_applied JSONB DEFAULT '{}',
  target_listing_id UUID,
  target_user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broker post performance tracking
CREATE TABLE broker_post_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  phone_reveals_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broker_id, listing_id)
);

-- Aggregated insights cache (for performance)
CREATE TABLE broker_insights_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  insights_data JSONB NOT NULL,
  ai_summary TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '6 hours'),
  UNIQUE(broker_id, city)
);

-- Indexes for performance
CREATE INDEX idx_user_behavior_event_type ON user_behavior(event_type);
CREATE INDEX idx_user_behavior_city ON user_behavior(city);
CREATE INDEX idx_user_behavior_created_at ON user_behavior(created_at);
CREATE INDEX idx_user_behavior_property_type ON user_behavior(property_type);
CREATE INDEX idx_user_behavior_target_listing ON user_behavior(target_listing_id);

CREATE INDEX idx_broker_analytics_broker_id ON broker_post_analytics(broker_id);
CREATE INDEX idx_broker_analytics_listing_id ON broker_post_analytics(listing_id);
CREATE INDEX idx_broker_analytics_created_at ON broker_post_analytics(created_at);

CREATE INDEX idx_insights_cache_broker_city ON broker_insights_cache(broker_id, city);
CREATE INDEX idx_insights_cache_expires ON broker_insights_cache(expires_at);

-- RLS
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_insights_cache ENABLE ROW LEVEL SECURITY;

-- Only brokers can view aggregated analytics
CREATE POLICY "Brokers can view behavior analytics" ON user_behavior
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.account_type = 'broker')
  );

CREATE POLICY "Brokers can view their own analytics" ON broker_post_analytics
  FOR SELECT USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own analytics" ON broker_post_analytics
  FOR ALL USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can view their own insights" ON broker_insights_cache
  FOR SELECT USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own insights" ON broker_insights_cache
  FOR ALL USING (auth.uid() = broker_id);

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION get_market_insights(
  target_city TEXT,
  days_back INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH behavior_stats AS (
    SELECT 
      property_type,
      COUNT(*) as search_count,
      AVG((budget_min + budget_max) / 2) as avg_budget,
      COUNT(CASE WHEN filters_applied->>'gender' = 'Male' THEN 1 END) as male_preference,
      COUNT(CASE WHEN filters_applied->>'gender' = 'Female' THEN 1 END) as female_preference,
      COUNT(CASE WHEN filters_applied->>'gated' = 'true' THEN 1 END) as gated_preference
    FROM user_behavior 
    WHERE city ILIKE target_city 
      AND event_type IN ('search', 'filter_apply')
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY property_type
  ),
  top_filters AS (
    SELECT 
      jsonb_object_keys(filters_applied) as filter_key,
      COUNT(*) as usage_count
    FROM user_behavior 
    WHERE city ILIKE target_city 
      AND event_type = 'filter_apply'
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY jsonb_object_keys(filters_applied)
    ORDER BY usage_count DESC
    LIMIT 5
  ),
  engagement_stats AS (
    SELECT 
      event_type,
      COUNT(*) as event_count,
      COUNT(DISTINCT user_id) as unique_users
    FROM user_behavior 
    WHERE city ILIKE target_city 
      AND created_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY event_type
  )
  SELECT jsonb_build_object(
    'city', target_city,
    'period_days', days_back,
    'property_demand', COALESCE((SELECT jsonb_agg(behavior_stats.*) FROM behavior_stats), '[]'::jsonb),
    'top_filters', COALESCE((SELECT jsonb_agg(top_filters.*) FROM top_filters), '[]'::jsonb),
    'engagement', COALESCE((SELECT jsonb_agg(engagement_stats.*) FROM engagement_stats), '[]'::jsonb),
    'generated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_broker_performance(
  target_broker_id UUID,
  days_back INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH post_stats AS (
    SELECT 
      l.id,
      l.title,
      l.property_type,
      l.city,
      l.rent,
      COALESCE(bpa.views_count, 0) as views,
      COALESCE(bpa.saves_count, 0) as saves,
      COALESCE(bpa.messages_count, 0) as messages,
      COALESCE(bpa.phone_reveals_count, 0) as phone_reveals,
      l.created_at
    FROM listings l
    LEFT JOIN broker_post_analytics bpa ON l.id = bpa.listing_id
    WHERE l.user_id = target_broker_id 
      AND l.created_at >= NOW() - INTERVAL '1 day' * days_back
  ),
  totals AS (
    SELECT 
      COUNT(*) as total_listings,
      SUM(views) as total_views,
      SUM(saves) as total_saves,
      SUM(messages) as total_messages,
      SUM(phone_reveals) as total_phone_reveals,
      AVG(views) as avg_views_per_post
    FROM post_stats
  )
  SELECT jsonb_build_object(
    'broker_id', target_broker_id,
    'period_days', days_back,
    'summary', (SELECT row_to_json(totals.*) FROM totals),
    'posts', COALESCE((SELECT jsonb_agg(post_stats.*) FROM post_stats), '[]'::jsonb),
    'generated_at', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS void AS $$
BEGIN
  DELETE FROM broker_insights_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
