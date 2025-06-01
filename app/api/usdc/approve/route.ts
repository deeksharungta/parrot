import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, spendingLimit, walletAddress } = body;

    if (!fid || !spendingLimit || !walletAddress) {
      return NextResponse.json(
        { error: "FID, spending limit, and wallet address are required" },
        { status: 400 },
      );
    }

    // Validate spending limit
    if (spendingLimit < 1 || spendingLimit > 1000) {
      return NextResponse.json(
        { error: "Spending limit must be between $1 and $1000" },
        { status: 400 },
      );
    }

    // In production, you would:
    // 1. Store the approval in your database
    // 2. Set up the USDC allowance contract interaction
    // 3. Track the user's spending limit and current balance

    // Mock database update
    console.log(`Approving USDC spending for FID ${fid}:`, {
      spendingLimit,
      walletAddress,
      timestamp: new Date().toISOString(),
    });

    // Simulate approval transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // In production, update user record:
    // await db.users.update({
    //   where: { farcaster_fid: fid },
    //   data: {
    //     spending_approved: true,
    //     spending_limit: spendingLimit,
    //     wallet_address: walletAddress,
    //     updated_at: new Date()
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: "USDC spending approved successfully",
      spendingLimit,
      walletAddress,
      approvalHash: "0x" + Math.random().toString(16).substring(2, 66), // Mock transaction hash
    });
  } catch (error) {
    console.error("Error approving USDC spending:", error);
    return NextResponse.json(
      { error: "Failed to approve USDC spending" },
      { status: 500 },
    );
  }
}
