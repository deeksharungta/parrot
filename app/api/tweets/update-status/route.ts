import { NextRequest, NextResponse } from "next/server";
import { updateTweetStatus } from "@/lib/tweets-service";
import { supabase } from "@/lib/supabase";
import {
  withInternalJwtAuth,
  createInternalJwtOptionsHandler,
} from "@/lib/internal-jwt-middleware";

export const OPTIONS = createInternalJwtOptionsHandler();

export const POST = withInternalJwtAuth(async function (
  request: NextRequest,
  userFid: number,
) {
  try {
    const body = await request.json();
    const { tweetId, status, additionalData } = body;

    if (!tweetId || !status) {
      return NextResponse.json(
        { error: "tweetId and status are required" },
        { status: 400 },
      );
    }

    if (!["approved", "rejected", "cast", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 },
      );
    }

    console.log("tweetId", tweetId);

    // Security: Verify that the tweet belongs to the authenticated user
    const { data: tweet, error: tweetError } = await supabase
      .from("tweets")
      .select(
        `
        *,
        users!inner(
          id,
          farcaster_fid
        )
      `,
      )
      .eq("id", tweetId)
      .single();

    console.log("tweet", tweet);

    if (tweetError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.users.farcaster_fid !== userFid) {
      return NextResponse.json(
        { error: "You can only update the status of your own tweets" },
        { status: 403 },
      );
    }

    // Update tweet status in database
    await updateTweetStatus(tweetId, status, additionalData);

    return NextResponse.json({
      success: true,
      message: `Tweet ${tweetId} status updated to ${status}`,
    });
  } catch (error) {
    console.error("Error updating tweet status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
