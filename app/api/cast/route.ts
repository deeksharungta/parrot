import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetId, fid, signerUuid, content } = body;

    if (!tweetId || !fid || !signerUuid) {
      return NextResponse.json(
        { error: "tweetId, fid, and signerUuid are required" },
        { status: 400 },
      );
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Get the tweet content to cast
    let tweetContent = content;
    if (!tweetContent) {
      // In production, fetch tweet content from your database
      // const tweet = await db.tweets.findUnique({ where: { id: tweetId } });
      // tweetContent = tweet?.content;

      // Mock: assume we have the content
      tweetContent = "Sample tweet content";
    }

    // Cast to Farcaster using Neynar API
    const castResponse = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast`, {
      method: "POST",
      headers: {
        "x-api-key": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        text: tweetContent,
        // Add any additional cast options here
      }),
    });

    if (!castResponse.ok) {
      const errorText = await castResponse.text();
      console.error("Neynar cast error:", castResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to cast to Farcaster" },
        { status: castResponse.status },
      );
    }

    const castData = await castResponse.json();

    // In production, update tweet status in database
    // await db.tweets.update({
    //   where: { id: tweetId },
    //   data: {
    //     cast_status: 'cast',
    //     cast_hash: castData.cast.hash,
    //     cast_url: `https://warpcast.com/${castData.cast.author.username}/${castData.cast.hash.slice(0, 10)}`
    //   }
    // });

    // Process payment (0.1 USDC)
    // await processPayment(fid, 0.1);

    const castUrl = `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castData.cast?.hash?.slice(0, 10) || "cast"}`;

    return NextResponse.json({
      success: true,
      message: "Tweet successfully casted to Farcaster",
      castHash: castData.cast?.hash,
      castUrl,
      cost: 0.1, // USDC
    });
  } catch (error) {
    console.error("Error casting tweet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
