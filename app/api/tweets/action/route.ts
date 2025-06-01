import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const neynar = new NeynarAPIClient(process.env.NEYNAR_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { tweetId, action, signerUuid } = await request.json();

    if (!tweetId || !action) {
      return NextResponse.json(
        { error: "Tweet ID and action are required" },
        { status: 400 },
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 },
      );
    }

    // Get the tweet from database
    const { data: tweet, error: fetchError } = await supabase
      .from("tweets")
      .select("*")
      .eq("id", tweetId)
      .single();

    if (fetchError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (action === "reject") {
      // Update tweet status to rejected
      const { error: updateError } = await supabase
        .from("tweets")
        .update({
          cast_status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", tweetId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: "Tweet rejected successfully",
      });
    }

    if (action === "approve") {
      if (!signerUuid) {
        return NextResponse.json(
          { error: "Signer UUID is required for approval" },
          { status: 400 },
        );
      }

      try {
        // Cast to Farcaster
        const castResponse = await neynar.publishCast(
          signerUuid,
          tweet.content,
        );

        // Update tweet with cast information
        const { error: updateError } = await supabase
          .from("tweets")
          .update({
            cast_status: "cast",
            cast_hash: castResponse.hash,
            cast_url: `https://warpcast.com/${castResponse.hash}`,
            cast_created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", tweetId);

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          message: "Tweet cast to Farcaster successfully",
          castHash: castResponse.hash,
          castUrl: `https://warpcast.com/${castResponse.hash}`,
        });
      } catch (castError) {
        console.error("Error casting to Farcaster:", castError);

        // Update tweet status to failed
        await supabase
          .from("tweets")
          .update({
            cast_status: "failed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", tweetId);

        return NextResponse.json(
          { error: "Failed to cast to Farcaster" },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Error processing tweet action:", error);
    return NextResponse.json(
      { error: "Failed to process tweet action" },
      { status: 500 },
    );
  }
}
