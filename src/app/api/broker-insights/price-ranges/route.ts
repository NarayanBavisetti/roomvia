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
      .select("min_rent, max_rent, usage_count, last_used, city, state")
      .or(`city.ilike.%${city}%,state.ilike.%${city}%`)
      .gte("last_used", startDate.toISOString())
      .lte("last_used", endDate.toISOString());

    if (error)
      return NextResponse.json(
        { error: "Failed to fetch price ranges" },
        { status: 500 }
      );

    const priceRanges: Record<string, number> = {
      "< ₹15k": 0,
      "₹15k-25k": 0,
      "₹25k-40k": 0,
      "> ₹40k": 0,
    };

    (data || []).forEach((d) => {
      const maxRent = d.max_rent || d.min_rent || 0;
      const count = d.usage_count || 1;
      if (maxRent < 15000) priceRanges["< ₹15k"] += count;
      else if (maxRent <= 25000) priceRanges["₹15k-25k"] += count;
      else if (maxRent <= 40000) priceRanges["₹25k-40k"] += count;
      else priceRanges["> ₹40k"] += count;
    });

    return NextResponse.json({ success: true, data: priceRanges });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
