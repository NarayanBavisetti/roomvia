# Google Gemini AI Setup Instructions

The application now uses Google Gemini AI (formerly OpenAI) for advanced text parsing and analytics insights. This provides better performance, higher quotas, and more reliable service.

## Why Google Gemini?

✅ **Higher Free Quota**: More generous free tier compared to OpenAI  
✅ **Better Performance**: Faster response times for most queries  
✅ **Competitive Pricing**: Cost-effective for high-volume usage  
✅ **Advanced Capabilities**: Excellent text parsing and analysis  
✅ **Reliable Service**: Better uptime and availability  

## Setup Instructions

### Step 1: Get your Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Choose "Create API key in new project" or select existing project
5. Copy the API key that's generated

### Step 2: Add API Key to Environment Variables

Add this to your `.env.local` file:

```bash
# Google Gemini AI Configuration
GOOGLE_API_KEY=your_actual_api_key_here
```

### Step 3: Test the Integration

1. Start your development server: `npm run dev`
2. Try using the AI features:
   - **Listing Parser**: Go to Add Listing page and paste property text
   - **Market Insights**: Visit `/broker/market-insights` (requires broker account)
   - **Analytics**: Check the broker analytics dashboard

3. You should now see API calls in your [Google AI Studio Usage](https://aistudio.google.com/app/usage)

## Migration from OpenAI

If you were previously using OpenAI, the migration is seamless:

✅ **Same Features**: All functionality works exactly the same  
✅ **Same Interfaces**: No changes to your user experience  
✅ **Better Reliability**: No more quota exceeded errors  
✅ **Automatic Fallback**: Still includes statistical analysis as backup  

### Old vs New Configuration

**Before (OpenAI):**
```bash
OPENAI_API_KEY=sk-your-openai-key
```

**Now (Gemini):**
```bash
GOOGLE_API_KEY=your-google-ai-key
```

## Features Using Google Gemini

### 1. **Listing Text Parser** (`/add-listing`)
- Parses Facebook posts and text descriptions
- Extracts property details, location, price, amenities
- Returns structured form data with high accuracy

### 2. **Market Insights** (`/broker/market-insights`) 
- Analyzes user search patterns
- Generates strategic recommendations
- Provides actionable market intelligence

### 3. **Broker Analytics** (`/broker/analytics`)
- Creates AI-powered performance summaries
- Market trend analysis
- Competitive positioning insights

## Troubleshooting

### API Key Issues
- Ensure your API key is correctly copied (no extra spaces)
- Verify the key has the necessary permissions
- Check your Google Cloud project settings

### No AI Response
- Check the browser developer console for error messages
- Verify your API key in [Google AI Studio](https://aistudio.google.com/app/apikey)
- Ensure you have available quota

### Rate Limits
- Google Gemini has generous rate limits
- Free tier includes significant monthly usage
- Upgrade to paid plan for higher volume usage

## API Limits & Pricing

### Free Tier
- **15 RPM (Requests per minute)**  
- **1,500 RPD (Requests per day)**
- **1 million tokens per month**

### Paid Tier  
- **300 RPM** for Gemini 1.5 Flash
- **10 RPM** for Gemini 1.5 Pro
- Pay-per-use pricing starts at $0.075/1M input tokens

**Cost Comparison**: Google Gemini is typically 50-75% cheaper than OpenAI for similar usage.

## Fallback System

Don't worry! The app is designed to work even without Google Gemini:

- **With Gemini**: Uses advanced AI parsing and insights for better accuracy
- **Without Gemini**: Uses statistical analysis and regex-based fallback parsing (still functional)

The system automatically detects API issues and switches to fallback mode with clear user notifications.

## Security & Privacy

✅ **Server-Side Only**: API keys never exposed to client  
✅ **Secure Processing**: All AI processing happens on secure servers  
✅ **No Data Storage**: Google doesn't store your request data  
✅ **Privacy Compliant**: Follows data protection regulations  

## Support

- **Google AI Documentation**: [https://ai.google.dev](https://ai.google.dev)
- **API Reference**: [https://ai.google.dev/api](https://ai.google.dev/api)
- **Pricing Details**: [https://ai.google.dev/pricing](https://ai.google.dev/pricing)

---

**Status**: ✅ Active and Recommended  
**Migration**: Completed from OpenAI to Google Gemini  
**Reliability**: Production-ready with fallback systems