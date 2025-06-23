import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export const OPTIONS = createOptionsHandler();

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const { fid, text, embeds } = body;

    // Use the authenticated user's FID instead of the one from the request body
    const userFid = fid || authenticatedFid;

    // Authorization check: ensure the FID in the request matches the authenticated user
    if (fid && fid !== authenticatedFid) {
      return NextResponse.json(
        { error: "Unauthorized: You can only cast for your own account" },
        { status: 403 },
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Text content is required for promotional cast" },
        { status: 400 },
      );
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("farcaster_fid", userFid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found or not registered" },
        { status: 404 },
      );
    }

    // Check if user already has a promotion cast
    if (user.promotion_cast_hash) {
      return NextResponse.json(
        { error: "User has already posted a promotional cast" },
        { status: 400 },
      );
    }

    // Prepare cast payload
    const castPayload: any = {
      signer_uuid: user.neynar_signer_uuid,
      text: text,
    };

    // Add embeds if provided
    if (embeds && embeds.length > 0) {
      castPayload.embeds = embeds.map((embed: string) => ({ url: embed }));
    }

    // Cast to Farcaster using Neynar API
    const castResponse = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast`, {
      method: "POST",
      headers: {
        "x-api-key": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castPayload),
    });

    if (!castResponse.ok) {
      const errorText = await castResponse.text();
      console.error("Neynar cast error:", castResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to cast to Farcaster" },
        { status: castResponse.status },
      );
    }

    const castData = await castResponse.json();
    const castHash = castData.cast?.hash;

    if (!castHash) {
      return NextResponse.json(
        { error: "Cast was created but hash not returned" },
        { status: 500 },
      );
    }

    // Update user in database: give 20 free casts and save cast hash
    const { error: updateError } = await supabase
      .from("users")
      .update({
        free_casts_given: (user.free_casts_given || 0) + 20,
        free_casts_left: (user.free_casts_left || 0) + 20,
        promotion_cast_hash: castHash,
        updated_at: new Date().toISOString(),
      })
      .eq("farcaster_fid", userFid);

    if (updateError) {
      console.error("Error updating user with free casts:", updateError);
      return NextResponse.json(
        { error: "Cast successful but failed to update user balance" },
        { status: 500 },
      );
    }

    const castUrl = `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castHash.slice(0, 10)}`;

    const response = NextResponse.json({
      success: true,
      message:
        "Promotional cast successfully posted! You've been granted 20 free casts.",
      castHash,
      castUrl,
      freeCastsAdded: 20,
      totalFreeCastsLeft: (user.free_casts_left || 0) + 20,
    });

    // Add CORS headers
    const origin = request.headers.get("origin") || "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "POST");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, x-api-key",
    );

    return response;
  } catch (error) {
    console.error("Error processing promotional cast:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
