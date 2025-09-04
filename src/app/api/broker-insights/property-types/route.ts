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
      .select("property_type, usage_count, last_used, city, state")
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString());

    if (error)
      return NextResponse.json(
        { error: "Failed to fetch property types" },
        { status: 500 }
      );

    const counts: Record<string, number> = {};
    (data || []).forEach((d) => {
      if (!d.property_type) return;
      counts[d.property_type] =
        (counts[d.property_type] || 0) + (d.usage_count || 1);
    });

    const distribution = Object.entries(counts)
      .map(([property_type, search_count]) => ({ property_type, search_count }))
      .sort((a, b) => b.search_count - a.search_count);

    return NextResponse.json({ success: true, data: distribution });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

