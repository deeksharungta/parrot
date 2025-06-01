import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { fid, signerUuid } = await request.json();

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // Get user data from Neynar
    const userData = await neynar.fetchBulkUsers([parseInt(fid)]);
    const user = userData.users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get verified Twitter account
    let verifiedTwitter = null;
    if (user.verified_accounts) {
      const twitterAccount = user.verified_accounts.find(
        (account) => account.platform === "x",
      );
      if (twitterAccount) {
        verifiedTwitter = {
          username: twitterAccount.username,
          // Note: We don't get the display name from verified accounts
          // You might need to fetch this separately using Twitter API
        };
      }
    }

    // Check if user exists in database
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("farcaster_fid", parseInt(fid))
      .single();

    let dbUser;
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from("users")
        .update({
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          neynar_signer_uuid: signerUuid,
          twitter_username:
            verifiedTwitter?.username || existingUser.twitter_username,
          updated_at: new Date().toISOString(),
        })
        .eq("farcaster_fid", parseInt(fid))
        .select()
        .single();

      if (error) throw error;
      dbUser = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          farcaster_fid: parseInt(fid),
          farcaster_username: user.username,
          farcaster_display_name: user.display_name,
          neynar_signer_uuid: signerUuid,
          twitter_username: verifiedTwitter?.username,
          farcaster_connected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      dbUser = data;
    }

    return NextResponse.json({
      user: dbUser,
      farcasterData: {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        profile: user.profile,
      },
      verifiedTwitter,
    });
  } catch (error) {
    console.error("Error saving user:", error);
    return NextResponse.json({ error: "Failed to save user" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const fid = url.searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("farcaster_fid", parseInt(fid))
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({ user: user || null });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
