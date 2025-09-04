import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || "Bangalore";
    const days = parseInt(searchParams.get("days") || "7");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("user_search_filters")
      .select("area, usage_count, last_used, city, state")
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString());

    if (error)
      return NextResponse.json(
        { error: "Failed to fetch locations" },
        { status: 500 }
      );

    const counts: Record<string, number> = {};
    (data || []).forEach((d) => {
      if (!d.area) return;
      counts[d.area] = (counts[d.area] || 0) + (d.usage_count || 1);
    });

    const locations = Object.entries(counts)
      .map(([area, search_count]) => ({ area, search_count }))
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, 15);

    return NextResponse.json({ success: true, data: locations });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

