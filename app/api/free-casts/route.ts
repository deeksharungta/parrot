import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";

export const OPTIONS = createOptionsHandler();

export const GET = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("free_casts_given, free_casts_left")
      .eq("farcaster_fid", authenticatedFid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found or not registered" },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      freeCastsLeft: user.free_casts_left || 0,
      totalFreeCastsGiven: user.free_casts_given || 0,
    });

    // Add CORS headers
    const origin = request.headers.get("origin") || "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, x-api-key",
    );

    return response;
  } catch (error) {
    console.error("Error fetching free casts info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
