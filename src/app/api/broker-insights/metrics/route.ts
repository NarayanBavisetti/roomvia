import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Bangalore";
    const days = parseInt(searchParams.get("days") || "7");

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, serviceKey!);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: filterData, error } = await supabase
      .from("user_search_filters")
      .select("user_id, usage_count, last_used, city, state")
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString());

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch metrics" },
        { status: 500 }
      );
    }

    const totalSearches = (filterData || []).reduce(
      (s, f) => s + (f.usage_count || 1),
      0
    );
    const uniqueUsers = new Set((filterData || []).map((f) => f.user_id)).size;

    return NextResponse.json({
      success: true,
      data: { totalSearches, uniqueUsers },
    });
  } catch (e) {
    console.error("Broker insights metrics error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
