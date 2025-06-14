import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getThreadTweets } from "@/lib/tweets-service";

const CAST_COST = 0.1; // USDC per thread

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversation_id");
    const userId = searchParams.get("user_id");

    if (!conversationId || !userId) {
      return NextResponse.json(
        { error: "conversation_id and user_id are required" },
        { status: 400 },
      );
    }

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
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("usdc_balance, spending_approved, spending_limit, total_spent")
      .eq("id", userId)
      .single();

    let canCast = false;
    if (!userError && user) {
      const hasBalance = (user.usdc_balance || 0) >= totalCost;
      const hasApproval = user.spending_approved;
      const withinLimit =
        !user.spending_limit ||
        (user.total_spent || 0) + totalCost <= user.spending_limit;

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
}
