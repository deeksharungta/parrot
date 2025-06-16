import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { supabase } from "@/lib/supabase";
import {
  withInternalAuth,
  createInternalOptionsHandler,
} from "@/lib/internal-auth-middleware";

export const OPTIONS = createInternalOptionsHandler();

export const POST = withInternalAuth(async function (req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { isValid: false, error: "Token is required" },
        { status: 400 },
      );
    }

    // Verify JWT token
    let payload;
    try {
      const { payload: jwtPayload } = await jose.jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET),
      );
      payload = jwtPayload;
    } catch (error) {
      return NextResponse.json(
        { isValid: false, error: "Invalid token" },
        { status: 401 },
      );
    }

    const fid = payload.fid as number;

    // Just check if user exists (no token comparison)
    const { data: user, error } = await supabase
      .from("users")
      .select("farcaster_fid")
      .eq("farcaster_fid", fid)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { isValid: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      isValid: true,
      fid: user.farcaster_fid,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { isValid: false, error: "Internal server error" },
      { status: 500 },
    );
  }
});
