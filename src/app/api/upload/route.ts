import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { supabase as supabaseClient } from "@/lib/supabase";
import { validateImageFile } from "@/lib/cloudinary";
import {
  serverUploadToCloudinary,
  deleteFromCloudinary,
} from "@/lib/cloudinary-server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user (try Authorization header first, then cookies)
    const authHeader = request.headers.get("authorization");
    const headerToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.split(" ")[1]
      : undefined;

    let user = null as
      | Awaited<ReturnType<typeof supabaseClient.auth.getUser>>["data"]["user"]
      | null;
    let authError: unknown = null;

    if (headerToken) {
      const { data, error } = await supabaseClient.auth.getUser(headerToken);
      user = data.user ?? null;
      authError = error;
    } else {
      const supabase = createRouteHandlerClient({ cookies });
      const result = await supabase.auth.getUser();
      user = result.data.user ?? null;
      authError = result.error;
    }

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const listingId = formData.get("listingId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await serverUploadToCloudinary(
      buffer,
      user.id,
      listingId || undefined,
      file.name,
      file.type || "image/jpeg"
    );

    return NextResponse.json({
      success: true,
      image: uploadResult,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    // Include a minimal error shape for debugging (safe to expose)
    const err = error as any;
    return NextResponse.json(
      {
        error: err?.message || "Failed to upload image",
        details: {
          httpCode:
            err?.http_code || err?.statusCode || err?.status || undefined,
          cloudinary:
            err?.error?.message ||
            err?.response?.body?.error?.message ||
            undefined,
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId");

    if (!publicId) {
      return NextResponse.json(
        { error: "Public ID required" },
        { status: 400 }
      );
    }

    const deleted = await deleteFromCloudinary(publicId);

    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Failed to delete image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
