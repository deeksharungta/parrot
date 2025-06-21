import { NextRequest, NextResponse } from "next/server";
import { withInternalJwtAuth } from "@/lib/internal-jwt-middleware";
import { supabase } from "@/lib/supabase";

export const POST = withInternalJwtAuth(async function (
  request: NextRequest,
  userFid: number,
) {
  try {
    // First, get the user ID from the farcaster_fid
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", userFid)
      .single();

    if (userError || !userData) {
      console.error("Error finding user:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update all rejected tweets for the authenticated user to pending status
    const { data, error } = await supabase
      .from("tweets")
      .update({
        cast_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("cast_status", "rejected")
      .eq("user_id", userData.id)
      .select("id, tweet_id, content");

    if (error) {
      console.error("Error updating rejected tweets:", error);
      return NextResponse.json(
        { error: "Failed to restore rejected tweets" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully restored ${data?.length || 0} rejected tweets to pending status`,
      restoredCount: data?.length || 0,
    });
  } catch (error) {
    console.error("Error in restore rejected tweets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
