import { NextRequest, NextResponse } from "next/server";

// Mock tweets data store (replace with actual database)
const mockTweets = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // In production, fetch from your database
    // const tweets = await db.tweets.findMany({
    //   where: { fid },
    //   orderBy: { twitter_created_at: 'desc' },
    //   limit: 20
    // });

    // Mock data for demo
    let tweets = mockTweets.get(fid);

    if (!tweets) {
      // Generate mock tweets for this FID
      tweets = [
        {
          id: "1",
          content:
            "Just shipped a new feature! Really excited about this one #development",
          twitter_created_at: new Date(
            Date.now() - 2 * 60 * 60 * 1000,
          ).toISOString(),
          twitter_url: "https://twitter.com/user/status/123",
          cast_status: "pending",
          is_edited: false,
        },
        {
          id: "2",
          content: "gm everyone! ☀️",
          twitter_created_at: new Date(
            Date.now() - 4 * 60 * 60 * 1000,
          ).toISOString(),
          twitter_url: "https://twitter.com/user/status/124",
          cast_status: "pending",
          is_edited: false,
        },
        {
          id: "3",
          content:
            "Building in public is so rewarding. The community feedback has been incredible! 🚀",
          twitter_created_at: new Date(
            Date.now() - 6 * 60 * 60 * 1000,
          ).toISOString(),
          twitter_url: "https://twitter.com/user/status/125",
          cast_status: "pending",
          is_edited: false,
        },
      ];
      mockTweets.set(fid, tweets);
    }

    return NextResponse.json({ tweets });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
