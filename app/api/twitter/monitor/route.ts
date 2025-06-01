import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, twitterUsername, signerUuid } = body;

    if (!fid || !twitterUsername || !signerUuid) {
      return NextResponse.json(
        { error: "FID, twitterUsername, and signerUuid are required" },
        { status: 400 },
      );
    }

    // In production, you would:
    // 1. Store the monitoring configuration in your database
    // 2. Set up Twitter API webhooks or polling
    // 3. Start background job to monitor tweets

    console.log(`Starting monitoring for @${twitterUsername} (FID: ${fid})`);

    // Mock: Save monitoring configuration
    // await db.monitoringConfigs.create({
    //   data: {
    //     fid,
    //     twitterUsername,
    //     signerUuid,
    //     isActive: true,
    //     createdAt: new Date()
    //   }
    // });

    // Mock: Start background monitoring service
    // await startTwitterMonitoring(twitterUsername, fid);

    return NextResponse.json({
      success: true,
      message: `Started monitoring @${twitterUsername}`,
      config: {
        fid,
        twitterUsername,
        isActive: true,
      },
    });
  } catch (error) {
    console.error("Error starting Twitter monitoring:", error);
    return NextResponse.json(
      { error: "Failed to start monitoring" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // In production, fetch monitoring status from database
    // const config = await db.monitoringConfigs.findUnique({
    //   where: { fid }
    // });

    return NextResponse.json({
      isMonitoring: true, // Mock response
      twitterUsername: "example_user", // Mock
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching monitoring status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
