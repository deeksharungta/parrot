import { NextRequest, NextResponse } from "next/server";

// This would typically connect to your database
// For now, we'll use a simple in-memory store (replace with actual DB)
const userSigners = new Map<string, string>();

export async function GET(
  request: NextRequest,
  { params }: { params: { fid: string } },
) {
  try {
    const { fid } = params;

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    // In production, fetch from your database
    // Example: const user = await db.users.findUnique({ where: { fid } });
    const signerUuid = userSigners.get(fid);

    if (!signerUuid) {
      return NextResponse.json({ signerUuid: null }, { status: 200 });
    }

    return NextResponse.json({ signerUuid });
  } catch (error) {
    console.error("Error fetching signer UUID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { fid: string } },
) {
  try {
    const { fid } = params;
    const body = await request.json();
    const { signerUuid } = body;

    if (!fid || !signerUuid) {
      return NextResponse.json(
        { error: "FID and signerUuid are required" },
        { status: 400 },
      );
    }

    // In production, save to your database
    // Example: await db.users.upsert({
    //   where: { fid },
    //   update: { signerUuid },
    //   create: { fid, signerUuid }
    // });

    userSigners.set(fid, signerUuid);

    return NextResponse.json({
      success: true,
      message: "Signer UUID saved successfully",
    });
  } catch (error) {
    console.error("Error saving signer UUID:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { fid: string } },
) {
  // Same as POST for updating signer UUID
  return POST(request, { params });
}
