import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signer_uuid, fid, username, display_name } = body;

    // Store user in database
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farcaster_fid: fid,
          farcaster_username: username,
          farcaster_display_name: display_name,
          neynar_signer_uuid: signer_uuid,
        }),
      },
    );

    const userData = await userResponse.json();

    return NextResponse.json({
      success: true,
      user: userData.user,
      message: "Farcaster connected successfully",
    });
  } catch (error) {
    console.error("Farcaster auth error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect Farcaster account",
      },
      { status: 500 },
    );
  }
}
