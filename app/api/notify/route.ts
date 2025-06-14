import { sendFrameNotification } from "@/lib/notification-client";
import { NextRequest, NextResponse } from "next/server";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";

export const OPTIONS = createOptionsHandler();

export const POST = withAuth(async function (request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, notification } = body;

    const result = await sendFrameNotification({
      fid,
      title: notification.title,
      body: notification.body,
      notificationDetails: notification.notificationDetails,
    });

    if (result.state === "error") {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
});
