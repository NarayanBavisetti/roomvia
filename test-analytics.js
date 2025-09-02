#!/usr/bin/env node

// Test script for broker analytics endpoints
// Usage: node test-analytics.js

const BASE_URL = 'http://localhost:3000';

async function testAnalyticsEndpoint(token, city = 'Bangalore', type = 'market', days = '7') {
  try {
    console.log(`\n🧪 Testing ${type} analytics for ${city}...`);
    
    const url = `${BASE_URL}/api/analytics/insights?type=${type}&city=${city}&days=${days}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error Response: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(`✅ Success! Data keys: ${Object.keys(data).join(', ')}`);
    
    if (type === 'market' && data.data) {
      console.log(`   - Property demand entries: ${data.data.property_demand?.length || 0}`);
      console.log(`   - Top filters entries: ${data.data.top_filters?.length || 0}`);
      console.log(`   - Engagement entries: ${data.data.engagement?.length || 0}`);
    }
    
    if (type === 'performance' && data.data) {
      console.log(`   - Total listings: ${data.data.summary?.total_listings || 0}`);
      console.log(`   - Total views: ${data.data.summary?.total_views || 0}`);
      console.log(`   - Posts entries: ${data.data.posts?.length || 0}`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return false;
  }
}

async function testBehaviorTracking() {
  try {
    console.log(`\n🧪 Testing behavior tracking...`);
    
    const testEvents = [
      {
        event_type: 'search',
        city: 'Bangalore',
        state: 'Karnataka',
        property_type: 'Apartment',
        budget_min: 15000,
        budget_max: 25000,
        filters_applied: { gender: 'Male', gated: 'true' },
        metadata: { test: true }
      },
      {
        event_type: 'listing_view',
        city: 'Bangalore', 
        target_listing_id: '12345678-1234-1234-1234-123456789012',
        metadata: { test: true }
      }
    ];

    for (const event of testEvents) {
      const response = await fetch(`${BASE_URL}/api/analytics/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      console.log(`📊 Event: ${event.event_type} - Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success! Session ID: ${result.session_id}`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Testing Broker Analytics Endpoints');
  console.log('=====================================');
  
  // You need to replace this with a valid broker JWT token
  const token = process.env.BROKER_TOKEN || 'YOUR_BROKER_JWT_TOKEN_HERE';
  
  if (token === 'YOUR_BROKER_JWT_TOKEN_HERE') {
    console.log(`
❌ SETUP REQUIRED:
   
   1. First, create a broker account in your app
   2. Login as the broker and get the JWT token from browser dev tools
   3. Run this script with the token:
   
      BROKER_TOKEN="eyJ..." node test-analytics.js
      
   Or edit this file and replace YOUR_BROKER_JWT_TOKEN_HERE with your actual token.
    `);
    return;
  }
  
  // Test both market and performance analytics
  await testAnalyticsEndpoint(token, 'Bangalore', 'market', '7');
  await testAnalyticsEndpoint(token, 'Bangalore', 'performance', '7');
  await testAnalyticsEndpoint(token, 'Delhi', 'market', '30');
  
  // Test behavior tracking (no auth required)
  await testBehaviorTracking();
  
  console.log(`
📋 NEXT STEPS:
   
   1. If you see database function errors, run the updated supabase-fresh-schema.sql
   2. Check your Supabase logs for detailed error messages
   3. Verify RLS policies are correctly set up
   4. Test with actual broker account from your frontend
  `);
}

main().catch(console.error);