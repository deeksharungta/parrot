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
      .select("promotion_cast_hash")
      .eq("farcaster_fid", authenticatedFid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found or not registered" },
        { status: 404 },
      );
    }

    // Check if user has already cast promotional cast
    const hasCasted = !!user.promotion_cast_hash;

    const response = NextResponse.json({
      hasCasted,
      promotionCastHash: user.promotion_cast_hash || null,
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
    console.error("Error checking promotional cast status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
