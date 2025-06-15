import { NextRequest, NextResponse } from "next/server";
import { withInternalAuth } from "@/lib/internal-auth-middleware";

export const POST = withInternalAuth(async function (request: NextRequest) {
  try {
    const { token, options = {} } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const {
      secure = process.env.NODE_ENV === "production",
      sameSite = "lax",
      maxAge = 60 * 60 * 24 * 7, // 7 days default
    } = options;

    const response = NextResponse.json({ success: true });

    // Set secure HTTP-only cookie
    const cookieOptions = [
      `auth_token=${token}`,
      `Max-Age=${maxAge}`,
      `Path=/`,
      `SameSite=${sameSite}`,
      "HttpOnly",
    ];

    if (secure) {
      cookieOptions.push("Secure");
    }

    response.headers.set("Set-Cookie", cookieOptions.join("; "));

    return response;
  } catch (error) {
    console.error("Error setting secure cookie:", error);
    return NextResponse.json(
      { error: "Failed to set secure cookie" },
      { status: 500 },
    );
  }
});
