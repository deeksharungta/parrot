import { NextRequest, NextResponse } from "next/server";
import { updateTweetStatus } from "@/lib/tweets-service";

export async function POST(request: NextRequest) {
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
}
