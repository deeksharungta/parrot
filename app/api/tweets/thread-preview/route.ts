import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getThreadTweets } from "@/lib/tweets-service";
import { parseTweetToFarcasterCast } from "@/lib/cast-utils";
import {
  withInternalJwtAuth,
  createInternalJwtOptionsHandler,
} from "@/lib/internal-jwt-middleware";

const CAST_COST = 0.1; // USDC per thread

export const OPTIONS = createInternalJwtOptionsHandler();

export const GET = withInternalJwtAuth(async function (
  request: NextRequest,
  userFid: number,
) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const userId = searchParams.get("user_id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 },
      );
    }

    // Security: Get the authenticated user's database ID instead of trusting the user_id parameter
    const { data: authenticatedUser, error: authUserError } = await supabase
      .from("users")
      .select(
        "id, usdc_balance, spending_approved, spending_limit, total_spent",
      )
      .eq("farcaster_fid", userFid)
      .single();

    if (authUserError || !authenticatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the authenticated user's ID from the database
    const authenticatedUserId = authenticatedUser.id;

    // Get all thread tweets
    const threadTweets = await getThreadTweets(conversationId);

    if (threadTweets.length === 0) {
      return NextResponse.json(
        { error: "No tweets found in this thread" },
        { status: 404 },
      );
    }

    // Filter pending tweets (not already cast)
    const pendingTweets = threadTweets.filter(
      (tweet) => tweet.cast_status === "pending",
    );
    const totalCost = CAST_COST;

    // Check if user can cast (has sufficient balance and permissions)
    // Use the already fetched authenticatedUser data
    let canCast = false;
    if (authenticatedUser) {
      const hasBalance = (authenticatedUser.usdc_balance || 0) >= totalCost;
      const hasApproval = authenticatedUser.spending_approved;
      const withinLimit =
        !authenticatedUser.spending_limit ||
        (authenticatedUser.total_spent || 0) + totalCost <=
          authenticatedUser.spending_limit;

      canCast =
        hasBalance && hasApproval && withinLimit && pendingTweets.length > 0;
    }

    return NextResponse.json({
      threadTweets,
      pendingTweets,
      totalCost,
      canCast,
      threadInfo: {
        totalTweets: threadTweets.length,
        pendingCount: pendingTweets.length,
        castCount: threadTweets.length - pendingTweets.length,
        costPerThread: CAST_COST,
      },
    });
  } catch (error) {
    console.error("Error getting thread preview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
