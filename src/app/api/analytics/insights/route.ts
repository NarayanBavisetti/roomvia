import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { openAIService } from "@/lib/openai";

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is authenticated and is a broker
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Create a per-request Supabase client with the caller's JWT so RLS applies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    const supabaseAuthed = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Check if user is a broker
    const { data: profile, error: profileError } = await supabaseAuthed
      .from("profiles")
      .select("account_type")
      .eq("user_id", user.id)
      .single();

    if (profileError || profile?.account_type !== "broker") {
      return NextResponse.json(
        { error: "Broker access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "";
    const days = parseInt(searchParams.get("days") || "7");
    const type = searchParams.get("type") || "market"; // 'market' or 'performance'

    if (type === "performance") {
      // Get broker's own post performance
      const { data, error } = await supabaseAuthed.rpc(
        "get_broker_performance",
        {
          target_broker_id: user.id,
          days_back: days,
        }
      );

      if (error) {
        console.error("Error fetching broker performance:", error);
        return NextResponse.json(
          {
            error: "Failed to fetch performance data",
            details: error.message || String(error),
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ data, type: "performance" });
    } else {
      // Get market insights for city
      if (!city) {
        return NextResponse.json(
          { error: "City parameter required for market insights" },
          { status: 400 }
        );
      }

      // Check cache first
      const { data: cached } = await supabaseAuthed
        .from("broker_insights_cache")
        .select("insights_data, ai_summary, generated_at")
        .eq("broker_id", user.id)
        .eq("city", city)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cached) {
        return NextResponse.json({
          data: cached.insights_data,
          ai_summary: cached.ai_summary,
          type: "market",
          cached: true,
          generated_at: cached.generated_at,
        });
      }

      // Fetch fresh market insights
      const { data, error } = await supabaseAuthed.rpc("get_market_insights", {
        target_city: city,
        days_back: days,
      });

      if (error) {
        console.error("Error fetching market insights:", error);
        return NextResponse.json(
          {
            error: "Failed to fetch market data",
            details: error.message || String(error),
          },
          { status: 500 }
        );
      }

      // Generate AI summary
      let aiSummary = "";
      try {
        const prompt = `Based on this market data for ${city}, provide insights for real estate brokers:

${JSON.stringify(data, null, 2)}

Generate a concise summary covering:
1. Most in-demand property types and budgets
2. Popular user preferences (gender, gated community, etc.)
3. Recommendations for brokers on what to post
4. Market trends and opportunities

Keep it practical and actionable for brokers.`;

        const aiResponse = await openAIService.generateInsights(
          user.id,
          prompt
        );
        aiSummary =
          aiResponse?.content || "AI insights temporarily unavailable";
      } catch (aiError) {
        console.error("AI summary generation failed:", aiError);
        aiSummary = "AI insights temporarily unavailable";
      }

      // Cache the results
      await supabaseAuthed.from("broker_insights_cache").upsert({
        broker_id: user.id,
        city,
        insights_data: data,
        ai_summary: aiSummary,
        expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
      });

      return NextResponse.json({
        data,
        ai_summary: aiSummary,
        type: "market",
        cached: false,
      });
    }
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Track user behavior events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      event_type,
      city,
      state,
      property_type,
      budget_min,
      budget_max,
      filters_applied,
      target_listing_id,
      target_user_id,
      metadata,
    } = body;

    // Get session info (user may be anonymous)
    const authHeader = request.headers.get("authorization");
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Generate session ID for anonymous tracking
    const sessionId =
      body.session_id ||
      `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { error } = await supabase.from("user_behavior").insert({
      user_id: userId,
      session_id: sessionId,
      event_type,
      city,
      state,
      property_type,
      budget_min,
      budget_max,
      filters_applied: filters_applied || {},
      target_listing_id,
      target_user_id,
      metadata: metadata || {},
    });

    if (error) {
      console.error("Error tracking behavior:", error);
      return NextResponse.json(
        { error: "Failed to track event" },
        { status: 500 }
      );
    }

    // Update broker analytics if this is an interaction with a listing
    if (
      target_listing_id &&
      ["listing_view", "save", "message_sent", "phone_reveal"].includes(
        event_type
      )
    ) {
      // Get listing owner
      const { data: listing } = await supabase
        .from("listings")
        .select("user_id")
        .eq("id", target_listing_id)
        .single();

      if (listing?.user_id) {
        // Check if owner is a broker
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("user_id", listing.user_id)
          .single();

        if (ownerProfile?.account_type === "broker") {
          // Update broker analytics
          const updateField =
            event_type === "listing_view"
              ? "views_count"
              : event_type === "save"
              ? "saves_count"
              : event_type === "message_sent"
              ? "messages_count"
              : event_type === "phone_reveal"
              ? "phone_reveals_count"
              : null;

          if (updateField) {
            await supabase.rpc("increment_broker_stat", {
              broker_id: listing.user_id,
              listing_id: target_listing_id,
              stat_field: updateField,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, session_id: sessionId });
  } catch (error) {
    console.error("Behavior tracking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
