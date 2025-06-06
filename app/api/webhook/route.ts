import {
  setUserNotificationDetails,
  deleteUserNotificationDetails,
} from "@/lib/notification-supabase";
import { sendFrameNotification } from "@/lib/notification-client";
import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";

export async function POST(request: Request) {
  try {
    const requestJson = await request.json();
    console.log({ requestJson });

    let data;
    try {
      data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
      console.log({ data });
    } catch (e: unknown) {
      const error = e as ParseWebhookEvent.ErrorType;

      switch (error.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          // The request data is invalid
          return Response.json(
            { success: false, error: error.message },
            { status: 400 },
          );
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          // The app key is invalid
          return Response.json(
            { success: false, error: error.message },
            { status: 401 },
          );
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          // Internal error verifying the app key (caller may want to try again)
          return Response.json(
            { success: false, error: error.message },
            { status: 500 },
          );
      }
    }

    console.log({ data });

    const fid = data.fid;
    const event = data.event;

    console.log({ fid, event });

    switch (event.event) {
      case "frame_added":
        console.log(
          "frame_added",
          "event.notificationDetails",
          event.notificationDetails,
        );
        if (event.notificationDetails) {
          await setUserNotificationDetails(
            fid,
            event.notificationDetails,
            "frame_added",
          );
          await sendFrameNotification({
            fid,
            title: `Welcome to XCast`,
            body: `Thank you for adding XCast`,
          });
        } else {
          await deleteUserNotificationDetails(fid, "frame_removed");
        }

        break;
      case "frame_removed": {
        console.log("frame_removed");
        await deleteUserNotificationDetails(fid, "frame_removed");
        break;
      }
      case "notifications_enabled": {
        console.log("notifications_enabled", event.notificationDetails);
        await setUserNotificationDetails(
          fid,
          event.notificationDetails,
          "notifications_enabled",
        );
        await sendFrameNotification({
          fid,
          title: `Welcome to XCast`,
          body: `Thank you for enabling notifications for XCast`,
        });

        break;
      }
      case "notifications_disabled": {
        console.log("notifications_disabled");
        await deleteUserNotificationDetails(fid, "notifications_disabled");

        break;
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return Response.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
