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
    const q = searchParams.get("q");
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    if (!q) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({ q });
    if (limit) queryParams.append("limit", limit);
    if (cursor) queryParams.append("cursor", cursor);

    // Call Neynar API to search channels
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/channel/search?${queryParams.toString()}`,
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
        { error: "Failed to search channels from Neynar" },
        { status: response.status },
      );
    }

    const searchData = await response.json();

    return NextResponse.json(searchData);
  } catch (error) {
    console.error("Error searching channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
