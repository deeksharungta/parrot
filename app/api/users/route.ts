import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      twitter_id,
      twitter_username,
      twitter_display_name,
      twitter_access_token,
      twitter_refresh_token,
      farcaster_fid,
      farcaster_username,
      farcaster_display_name,
      neynar_signer_uuid,
      yolo_mode = false,
      notifications_enabled = true,
      spending_limit = 10.0,
    } = body;

    let existingUser = null;
    if (twitter_id) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("twitter_id", twitter_id)
        .single();
      existingUser = data;
    }

    if (!existingUser && farcaster_fid) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("farcaster_fid", farcaster_fid)
        .single();
      existingUser = data;
    }

    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from("users")
        .update({
          twitter_id: twitter_id || existingUser.twitter_id,
          twitter_username: twitter_username || existingUser.twitter_username,
          twitter_display_name:
            twitter_display_name || existingUser.twitter_display_name,
          twitter_access_token:
            twitter_access_token || existingUser.twitter_access_token,
          twitter_refresh_token:
            twitter_refresh_token || existingUser.twitter_refresh_token,
          twitter_connected_at: twitter_id
            ? new Date().toISOString()
            : existingUser.twitter_connected_at,
          farcaster_fid: farcaster_fid || existingUser.farcaster_fid,
          farcaster_username:
            farcaster_username || existingUser.farcaster_username,
          farcaster_display_name:
            farcaster_display_name || existingUser.farcaster_display_name,
          neynar_signer_uuid:
            neynar_signer_uuid || existingUser.neynar_signer_uuid,
          farcaster_connected_at: farcaster_fid
            ? new Date().toISOString()
            : existingUser.farcaster_connected_at,
          yolo_mode,
          notifications_enabled,
          spending_limit,
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        user: data,
        message: "User updated successfully",
      });
    } else {
      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          twitter_id,
          twitter_username,
          twitter_display_name,
          twitter_access_token,
          twitter_refresh_token,
          twitter_connected_at: twitter_id ? new Date().toISOString() : null,
          farcaster_fid,
          farcaster_username,
          farcaster_display_name,
          neynar_signer_uuid,
          farcaster_connected_at: farcaster_fid
            ? new Date().toISOString()
            : null,
          yolo_mode,
          notifications_enabled,
          spending_limit,
          usdc_balance: 0,
          total_spent: 0,
          spending_approved: false,
          auto_approve: false,
        })
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(
        {
          success: true,
          user: data,
          message: "User created successfully",
        },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create/update user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");
    const twitterId = searchParams.get("twitter_id");
    const farcasterFid = searchParams.get("farcaster_fid");

    let query = supabase.from("users").select("*");

    if (userId) {
      query = query.eq("id", userId);
    } else if (twitterId) {
      query = query.eq("twitter_id", twitterId);
    } else if (farcasterFid) {
      query = query.eq("farcaster_fid", parseInt(farcasterFid));
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide user ID, Twitter ID, or Farcaster FID",
        },
        { status: 400 },
      );
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            error: "User not found",
          },
          { status: 404 },
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
