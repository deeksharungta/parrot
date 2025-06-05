import { NextRequest, NextResponse } from "next/server";
import { getUserFrameStatus } from "@/lib/notification-supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get("fid");

    if (!fidParam) {
      return NextResponse.json(
        { error: "FID parameter is required" },
        { status: 400 },
      );
    }

    const fid = parseInt(fidParam);

    if (isNaN(fid)) {
      return NextResponse.json(
        { error: "Invalid FID parameter" },
        { status: 400 },
      );
    }

    const userStatus = await getUserFrameStatus(fid);

    if (!userStatus) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      fid,
      user: {
        farcaster_fid: userStatus.farcaster_fid,
        has_frame: userStatus.has_frame,
        notifications_enabled: userStatus.notifications_enabled,
        has_notification_token: !!userStatus.notification_token,
        has_notification_url: !!userStatus.notification_url,
      },
    });
  } catch (error) {
    console.error("Error fetching user frame status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
