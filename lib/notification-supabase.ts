import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { supabase } from "./supabase";
import { Database } from "./types/database";

type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function getUserNotificationDetails(
  fid: number,
): Promise<FrameNotificationDetails | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("notification_token, notification_url, notifications_enabled")
      .eq("farcaster_fid", fid)
      .eq("notifications_enabled", true)
      .single();

    if (error || !data) {
      return null;
    }

    if (data.notification_token && data.notification_url) {
      return {
        token: data.notification_token,
        url: data.notification_url,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting user notification details:", error);
    return null;
  }
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails,
  eventType: "frame_added" | "notifications_enabled" = "frame_added",
): Promise<void> {
  try {
    const updates: UserUpdate = {
      notification_token: notificationDetails.token,
      notification_url: notificationDetails.url,
      notifications_enabled: true,
      updated_at: new Date().toISOString(),
    };

    // If it's a frame_added event, also set has_frame to true
    if (eventType === "frame_added") {
      updates.has_frame = true;
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("farcaster_fid", fid);

    if (error) {
      console.error("Error setting user notification details:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error setting user notification details:", error);
    throw error;
  }
}

export async function deleteUserNotificationDetails(
  fid: number,
  eventType: "frame_removed" | "notifications_disabled" = "frame_removed",
): Promise<void> {
  try {
    const updates: UserUpdate = {
      notification_token: null,
      notification_url: null,
      notifications_enabled: false,
      updated_at: new Date().toISOString(),
    };

    // If it's a frame_removed event, also set has_frame to false
    if (eventType === "frame_removed") {
      updates.has_frame = false;
    }

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("farcaster_fid", fid);

    if (error) {
      console.error("Error deleting user notification details:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error deleting user notification details:", error);
    throw error;
  }
}

// Optional: Create a simple event log function if you want to track history
export async function logFrameEvent(
  fid: number,
  eventType:
    | "frame_added"
    | "frame_removed"
    | "notifications_enabled"
    | "notifications_disabled",
  notificationDetails?: FrameNotificationDetails,
): Promise<void> {
  try {
  } catch (error) {
    console.error("Error logging frame event:", error);
  }
}

// Get user's current frame and notification status
export async function getUserFrameStatus(fid: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "farcaster_fid, has_frame, notifications_enabled, notification_token, notification_url",
      )
      .eq("farcaster_fid", fid)
      .single();

    if (error) {
      console.error("Error getting user frame status:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting user frame status:", error);
    return null;
  }
}
