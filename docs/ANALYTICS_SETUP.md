# Broker Analytics Setup Guide

This guide will help you set up the comprehensive broker analytics functionality with OpenAI GPT-4o Mini integration.

## Prerequisites

1. Supabase project with existing listings and users tables
2. OpenAI API key (GPT-4o Mini access)
3. Next.js application with TypeScript

## 1. Database Setup

Run the analytics schema in your Supabase SQL Editor:

```sql
-- Copy and execute the contents of scripts/analytics-schema.sql
```

This creates the following tables:
- `search_analytics` - Tracks user search behavior
- `listing_analytics` - Stores listing performance metrics
- `user_behavior` - Records user interactions
- `market_trends` - Market data aggregation
- `broker_insights_cache` - Caches AI-generated insights
- `listing_optimizations` - AI recommendations for listings
- `performance_benchmarks` - Competitive analysis data

## 2. Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## 3. Analytics Integration

### Automatic Tracking

Wrap your app with the analytics wrapper in `layout.tsx`:

```tsx
import { AnalyticsWrapper } from '@/components/analytics/AnalyticsWrapper'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnalyticsWrapper>
          {children}
        </AnalyticsWrapper>
      </body>
    </html>
  )
}
```

### Listing Components

Enhance your listing cards with analytics:

```tsx
import { AnalyticsListingCard } from '@/components/analytics/AnalyticsWrapper'

function ListingCard({ listing }) {
  return (
    <AnalyticsListingCard listing={listing}>
      <YourExistingListingCard />
    </AnalyticsListingCard>
  )
}
```

### Search Components

Track search behavior:

```tsx
import { SearchAnalyticsWrapper } from '@/components/analytics/AnalyticsWrapper'

function SearchPage() {
  return (
    <SearchAnalyticsWrapper>
      <YourSearchComponent />
    </SearchAnalyticsWrapper>
  )
}
```

## 4. Broker Dashboard

Access the analytics dashboard at `/broker/analytics`. The dashboard provides:

### Performance Metrics
- Total views across all listings
- Inquiry conversion rates
- Average listing performance
- Competitive rating

### AI-Powered Insights
- Market trend analysis
- Pricing optimization suggestions
- Content improvement recommendations
- Target audience insights
- Popular search keywords
- Missing amenities analysis

### Interactive Features
- Time range selection (7, 30, 90 days)
- Real-time data refresh
- AI insights generation on demand
- Detailed listing performance tables

## 5. Manual Analytics Tracking

For custom components, use the analytics hooks:

```tsx
import { useListingAnalytics } from '@/hooks/useAnalyticsIntegration'

function CustomComponent() {
  const { onListingView, onListingSave } = useListingAnalytics()

  const handleView = () => {
    onListingView('listing-id', 'broker-id')
  }

  const handleSave = () => {
    onListingSave('listing-id')
  }

  // ... your component logic
}
```

## 6. API Endpoints

The system provides REST endpoints for analytics:

- `POST /api/analytics/insights` - Generate AI insights
- `GET /api/analytics/insights?userId=...` - Get cached insights

## 7. Features

### Data Collection
✅ **Search Analytics**: Keywords, filters, locations, price ranges  
✅ **Listing Performance**: Views, saves, inquiries, conversions  
✅ **User Behavior**: Click patterns, time spent, feature interactions  
✅ **Market Trends**: Area demand, pricing, seasonality  

### AI-Powered Insights
✅ **GPT-4o Mini Integration**: Cost-effective AI analysis  
✅ **Rate Limiting**: 20 requests/minute, 500/day  
✅ **Fallback System**: Works without OpenAI API  
✅ **Caching**: 24-hour insight cache  

### Dashboard Features
✅ **Performance Metrics**: Views, inquiries, conversion rates  
✅ **Market Insights**: Trending keywords, popular features  
✅ **Recommendations**: Pricing, content, timing strategies  
✅ **Competitive Analysis**: Market positioning  
✅ **Real-time Updates**: Live data refresh  

## 8. OpenAI Integration Details

### Model: GPT-4o Mini
- Cost-effective alternative to GPT-4
- Suitable for analytics and insights
- Fast response times
- Good for structured data analysis

### Rate Limits
- 20 requests per minute per user
- 500 requests per day total
- Automatic rate limiting
- Graceful fallbacks

### Prompt Engineering
- Specialized prompts for real estate analytics
- JSON response formatting
- Market-specific insights
- Actionable recommendations

## 9. Security & Privacy

### Row Level Security (RLS)
- Brokers can only see their own data
- User search data is protected
- Anonymous tracking for non-logged users

### Data Privacy
- No personal information in OpenAI requests
- Aggregated data only
- Secure API key management

## 10. Performance Optimization

### Caching Strategy
- 24-hour AI insights cache
- Database query optimization
- Indexed analytics tables
- Efficient data aggregation

### Background Processing
- Async analytics collection
- Non-blocking user experience
- Batch data processing
- Real-time updates

## 11. Troubleshooting

### Common Issues

**Analytics not tracking:**
- Check if AnalyticsWrapper is properly installed
- Verify Supabase connection
- Check browser console for errors

**AI insights not generating:**
- Verify OpenAI API key
- Check rate limits
- Review API endpoint logs

**Dashboard not loading:**
- Ensure user is authenticated
- Check database permissions
- Verify analytics tables exist

### Debug Mode

Enable debug logging:

```tsx
// In your analytics service
localStorage.setItem('analytics_debug', 'true')
```

## 12. Extending the System

### Custom Analytics Events

```tsx
import { useAnalytics } from '@/lib/analytics'

function CustomComponent() {
  const { trackEvent } = useAnalytics()

  const handleCustomAction = () => {
    trackEvent('custom_action', 'listing-id', {
      customData: 'value',
      timestamp: Date.now()
    })
  }
}
```

### Additional AI Insights

Extend the OpenAI service for custom insights:

```tsx
// Add to openai.ts
async generateCustomInsights(data: CustomData) {
  // Your custom AI analysis
}
```

## Next Steps

1. **Set up the database schema**
2. **Configure environment variables**
3. **Install the analytics wrapper**
4. **Test the dashboard at /broker/analytics**
5. **Generate your first AI insights**

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review component logs
3. Test with sample data
4. Verify API credentials

The analytics system is designed to be robust, scalable, and provide actionable insights to help brokers optimize their listings and understand market trends.