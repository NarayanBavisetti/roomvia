import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

// Create a per-request authed Supabase client using cookies
const getAuthedSupabase = async () => {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({
    cookies: () => cookieStore,
  });

  // Get the session from the route handler client
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  console.log("Session error:", sessionError);
  console.log(
    "Session:",
    session
      ? { user_id: session.user.id, expires_at: session.expires_at }
      : null
  );

  return { supabase, user: session?.user ?? null } as const;
};

// Helper to get an authed supabase client and user, using cookies or Authorization header fallback
const getSupabaseAndUser = async (request: NextRequest) => {
  const base = await getAuthedSupabase();
  let { supabase, user } = base;

  if (!user) {
    const authHeader = request.headers.get("authorization");
    const token =
      authHeader && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.split(" ")[1]
        : undefined;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      console.log("Header token auth error:", error);
      if (data?.user) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
        const supabaseAnonKey = process.env
          .NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
        supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        user = data.user;
      }
    }
  }

  return { supabase, user } as const;
};

export async function GET(request: NextRequest) {
  console.log("GET /api/filters called");
  try {
    const { supabase, user } = await getSupabaseAndUser(request);
    console.log(
      "User from auth:",
      user ? { id: user.id, email: user.email } : "null"
    );
    if (!user) {
      console.log("No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id") || user.id;

    // Return the single filters row for the user
    const { data, error } = await supabase
      .from("user_search_filters")
      .select(
        "id, user_id, city, state, area, property_type, min_rent, max_rent, amenities, filters, usage_count, last_used, created_at, updated_at"
      )
      .eq("user_id", targetUserId)
      .order("last_used", { ascending: false })
      .limit(1);

    if (error) {
      console.error("GET /api/filters Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load filters", details: error.message },
        { status: 500 }
      );
    }

    // Return as array to maintain compatibility with existing code
    return NextResponse.json({ filters: data || [] });
  } catch (error) {
    console.error("GET /api/filters unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("POST /api/filters called - creating new filter record");
  try {
    const { supabase, user } = await getSupabaseAndUser(request);
    console.log(
      "User from auth:",
      user ? { id: user.id, email: user.email } : "null"
    );
    if (!user) {
      console.log("No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      session_id,
      filters,
      city,
      state,
      area,
      property_type,
      min_rent,
      max_rent,
      amenities,
    } = body || {};

    // Enforce user ownership
    if (user_id && user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if user already has a filter record
    const { data: existingFilter } = await supabase
      .from("user_search_filters")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existingFilter) {
      return NextResponse.json(
        { error: "Filter record already exists. Use PATCH to update." },
        { status: 409 }
      );
    }

    const insertPayload = {
      user_id: user.id,
      session_id: session_id || null,
      city: city || null,
      state: state || null,
      area: area || null,
      property_type: property_type || null,
      min_rent: typeof min_rent === "number" ? min_rent : null,
      max_rent: typeof max_rent === "number" ? max_rent : null,
      amenities: Array.isArray(amenities) ? amenities : null,
      filters: filters || {},
      usage_count: 1,
      last_used: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as const;

    const { data: inserted, error: insertError } = await supabase
      .from("user_search_filters")
      .insert(insertPayload)
      .select(
        "id, user_id, city, state, area, property_type, min_rent, max_rent, amenities, filters, usage_count, last_used, created_at, updated_at"
      )
      .single();

    if (insertError) {
      console.error("POST /api/filters insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save filters", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, filter: inserted });
  } catch (error) {
    console.error("POST /api/filters unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  console.log("PATCH /api/filters called - updating existing filter record");
  try {
    const { supabase, user } = await getSupabaseAndUser(request);
    console.log(
      "User from auth:",
      user ? { id: user.id, email: user.email } : "null"
    );
    if (!user) {
      console.log("No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      user_id,
      session_id,
      filters,
      city,
      state,
      area,
      property_type,
      min_rent,
      max_rent,
      amenities,
    } = body || {};

    // Enforce user ownership
    if (user_id && user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update existing filter record
    const updatePayload = {
      session_id: session_id || null,
      city: city || null,
      state: state || null,
      area: area || null,
      property_type: property_type || null,
      min_rent: typeof min_rent === "number" ? min_rent : null,
      max_rent: typeof max_rent === "number" ? max_rent : null,
      amenities: Array.isArray(amenities) ? amenities : null,
      filters: filters || {},
      usage_count: 1, // Reset usage count or increment if needed
      last_used: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as const;

    const { data: updated, error: updateError } = await supabase
      .from("user_search_filters")
      .update(updatePayload)
      .eq("user_id", user.id)
      .select(
        "id, user_id, city, state, area, property_type, min_rent, max_rent, amenities, filters, usage_count, last_used, created_at, updated_at"
      )
      .single();

    if (updateError) {
      console.error("PATCH /api/filters update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update filters", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, filter: updated });
  } catch (error) {
    console.error("PATCH /api/filters unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log("DELETE /api/filters called");
  try {
    const { supabase, user } = await getSupabaseAndUser(request);
    console.log("User from auth:", user ? { id: user.id, email: user.email } : "null");
    if (!user) {
      console.log("No user found - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check if there are any records to delete
    const { data: existingRecords, error: selectError } = await supabase
      .from("user_search_filters")
      .select("id")
      .eq("user_id", user.id);

    if (selectError) {
      console.error("DELETE /api/filters select error:", selectError);
      return NextResponse.json(
        { error: "Failed to check existing filters", details: selectError.message },
        { status: 500 }
      );
    }

    console.log("Existing records to delete:", existingRecords?.length || 0);

    // Try using RPC function first (bypasses RLS)
    const { error: rpcError } = await supabase.rpc("delete_user_filters", {
      p_user_id: user.id,
    });

    if (rpcError) {
      console.log("RPC delete failed, trying direct delete:", rpcError);
      // Fallback to direct delete
      const { error: directError } = await supabase
        .from("user_search_filters")
        .delete()
        .eq("user_id", user.id);

      if (directError) {
        console.error("DELETE /api/filters both methods failed:", { rpcError, directError });
        return NextResponse.json(
          { error: "Failed to delete filters", rpcError: rpcError.message, directError: directError.message },
          { status: 500 }
        );
      }
    }

    console.log("Successfully deleted filters for user:", user.id);
    return NextResponse.json({ success: true, deletedCount: existingRecords?.length || 0 });
  } catch (error) {
    console.error("DELETE /api/filters unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
