import { NextRequest, NextResponse } from "next/server";
import {
  withInternalAuth,
  createInternalOptionsHandler,
} from "@/lib/internal-auth-middleware";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

export const OPTIONS = createInternalOptionsHandler();

export const GET = withInternalAuth(async function (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Call Neynar API to get user information
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Neynar API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch user data from Neynar" },
        { status: response.status },
      );
    }

    const userData = await response.json();

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
