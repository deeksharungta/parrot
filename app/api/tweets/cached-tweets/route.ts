import { NextRequest, NextResponse } from "next/server";
import { getCachedTweets } from "@/lib/tweets-service";
import {
  withInternalJwtAuth,
  createInternalJwtOptionsHandler,
} from "@/lib/internal-jwt-middleware";

export const OPTIONS = createInternalJwtOptionsHandler();

export const GET = withInternalJwtAuth(async function (
  request: NextRequest,
  userFid: number,
) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    const fidNumber = parseInt(fid, 10);
    if (isNaN(fidNumber)) {
      return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
    }

    // Security: Ensure user can only fetch tweets for their own FID
    if (fidNumber !== userFid) {
      return NextResponse.json(
        { error: "You can only fetch tweets for your own account" },
        { status: 403 },
      );
    }

    // Get cached tweets from database
    const cachedData = await getCachedTweets(fidNumber);

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error("Error in cached tweets API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
