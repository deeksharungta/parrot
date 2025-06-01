import { NextRequest, NextResponse } from "next/server";

// Mock tweets data store (should match the one in tweets/route.ts)
const mockTweets = new Map<string, any[]>();

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetId, content, fid } = body;

    if (!tweetId || !content || !fid) {
      return NextResponse.json(
        { error: "tweetId, content, and fid are required" },
        { status: 400 },
      );
    }

    // In production, update in your database
    // const updatedTweet = await db.tweets.update({
    //   where: { id: tweetId, fid },
    //   data: {
    //     content,
    //     is_edited: true,
    //     edit_count: { increment: 1 },
    //     updated_at: new Date()
    //   }
    // });

    // Mock: Update in memory store
    let userTweets = mockTweets.get(fid);
    if (userTweets) {
      const tweetIndex = userTweets.findIndex((tweet) => tweet.id === tweetId);
      if (tweetIndex !== -1) {
        userTweets[tweetIndex] = {
          ...userTweets[tweetIndex],
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        };
        mockTweets.set(fid, userTweets);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Tweet updated successfully",
      tweetId,
      newContent: content,
    });
  } catch (error) {
    console.error("Error editing tweet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
