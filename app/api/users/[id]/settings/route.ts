import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const userId = params.id;

    const {
      yolo_mode,
      notifications_enabled,
      auto_approve,
      spending_limit,
      spending_approved,
    } = body;

    const { data, error } = await supabase
      .from("users")
      .update({
        yolo_mode,
        notifications_enabled,
        auto_approve,
        spending_limit,
        spending_approved,
      })
      .eq("id", userId)
      .select(
        "id, yolo_mode, notifications_enabled, auto_approve, spending_limit, spending_approved",
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      settings: data,
      message: "Settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
