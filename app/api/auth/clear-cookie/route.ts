import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the HTTP-only cookie by setting it with a past expiration date
    const cookieOptions = [
      "auth_token=",
      "Max-Age=0",
      "Path=/",
      "expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "HttpOnly",
    ];

    if (process.env.NODE_ENV === "production") {
      cookieOptions.push("Secure");
    }

    response.headers.set("Set-Cookie", cookieOptions.join("; "));

    return response;
  } catch (error) {
    console.error("Error clearing secure cookie:", error);
    return NextResponse.json(
      { error: "Failed to clear secure cookie" },
      { status: 500 },
    );
  }
}
