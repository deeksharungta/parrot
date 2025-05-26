import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const userId = params.id;
    const { amount, operation } = body; // operation: 'add' or 'subtract'

    // Get current balance
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("usdc_balance, total_spent")
      .eq("id", userId)
      .single();

    if (fetchError) throw fetchError;

    let newBalance = user.usdc_balance;
    let newTotalSpent = user.total_spent;

    if (operation === "add") {
      newBalance += amount;
    } else if (operation === "subtract") {
      if (user.usdc_balance < amount) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient balance",
          },
          { status: 400 },
        );
      }
      newBalance -= amount;
      newTotalSpent += amount;
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        usdc_balance: newBalance,
        total_spent: newTotalSpent,
      })
      .eq("id", userId)
      .select("usdc_balance, total_spent")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      balance: data,
      message: "Balance updated successfully",
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update balance",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
