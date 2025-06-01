import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const redirectUri = searchParams.get("redirect_uri");

    if (!state || !redirectUri) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // In production, you would use your actual Neynar OAuth app credentials
    const neynarClientId =
      process.env.NEYNAR_CLIENT_ID || "your-neynar-client-id";

    // Construct Neynar OAuth authorization URL
    const neynarAuthUrl = new URL("https://app.neynar.com/oauth/authorize");
    neynarAuthUrl.searchParams.set("client_id", neynarClientId);
    neynarAuthUrl.searchParams.set("redirect_uri", redirectUri);
    neynarAuthUrl.searchParams.set("response_type", "code");
    neynarAuthUrl.searchParams.set("state", state);
    neynarAuthUrl.searchParams.set("scope", "cast:write"); // Request casting permissions

    // Redirect to Neynar OAuth
    return NextResponse.redirect(neynarAuthUrl.toString());
  } catch (error) {
    console.error("Error in Neynar authorize:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
