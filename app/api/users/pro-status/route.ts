import { NextRequest, NextResponse } from "next/server";
import { checkUserProStatus } from "@/lib/cast-utils";
import { validateJwtAuth } from "@/lib/jwt-auth-middleware";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token and get user
    const authResult = await validateJwtAuth(request);
    if (!authResult.isValid || !authResult.fid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check pro status using the existing function
    const isProUser = await checkUserProStatus(authResult.fid);

    return NextResponse.json({ isProUser });
  } catch (error) {
    console.error("Error checking pro status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
