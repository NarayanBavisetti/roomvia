import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { geminiService } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();
    const { text, inputType } = body as {
      text: string;
      inputType?: "text" | "facebook";
    };

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await geminiService.parseListingText(
      user.id,
      text,
      inputType === "facebook" ? "facebook" : "text"
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Parse listing API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to parse listing text";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
