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
      .select("amenities, filters, usage_count, last_used, city, state")
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString());

    if (error)
      return NextResponse.json(
        { error: "Failed to fetch amenities" },
        { status: 500 }
      );

    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      const increment = item.usage_count || 1;
      if (Array.isArray(item.amenities)) {
        item.amenities.forEach((a: string) => {
          counts[a] = (counts[a] || 0) + increment;
        });
      }
      if (item.filters && typeof item.filters === "object") {
        const f = item.filters as Record<string, unknown>;
        if (Array.isArray(f.furnishing)) {
          (f.furnishing as string[]).forEach((a) => {
            counts[a] = (counts[a] || 0) + increment;
          });
        }
      }
    });

    const popularAmenities = Object.entries(counts)
      .map(([amenity, usage_count]) => ({ amenity, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 12);

    return NextResponse.json({ success: true, data: popularAmenities });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

