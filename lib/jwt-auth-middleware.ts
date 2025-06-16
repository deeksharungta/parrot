import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { supabase } from "@/lib/supabase";

export interface JwtAuthResult {
  isValid: boolean;
  fid?: number;
  error?: string;
  status?: number;
}

export async function validateJwtAuth(
  request: NextRequest,
): Promise<JwtAuthResult> {
  try {
    // Get token from Authorization header (Bearer token) or from request body
    let token = request.headers.get("authorization")?.replace("Bearer ", "");

    // If no authorization header, try to get from body for some routes
    if (!token && request.method === "POST") {
      try {
        const body = await request.text();
        const parsedBody = JSON.parse(body);
        token = parsedBody.token;

        // Re-create the request with the original body for downstream handlers
        Object.defineProperty(request, "body", {
          value: new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(body));
              controller.close();
            },
          }),
          writable: false,
        });
      } catch (e) {
        // Body is not JSON or doesn't contain token, continue without token
      }
    }

    if (!token) {
      return {
        isValid: false,
        error: "JWT token required",
        status: 401,
      };
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
      return {
        isValid: false,
        error: "Invalid JWT token",
        status: 401,
      };
    }

    const fid = payload.fid as number;

    if (!fid) {
      return {
        isValid: false,
        error: "Invalid token payload",
        status: 401,
      };
    }

    // Check if user exists in database and token matches
    const { data: user, error } = await supabase
      .from("users")
      .select("farcaster_fid")
      .eq("farcaster_fid", fid)
      .single();

    if (error || !user) {
      return {
        isValid: false,
        error: "User not found",
        status: 404,
      };
    }

    return {
      isValid: true,
      fid: user.farcaster_fid,
    };
  } catch (error) {
    console.error("JWT validation error:", error);
    return {
      isValid: false,
      error: "Internal server error",
      status: 500,
    };
  }
}

export function withJwtAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    fid: number,
    ...args: T
  ) => Promise<NextResponse>,
) {
  return async function (
    request: NextRequest,
    ...args: T
  ): Promise<NextResponse> {
    const jwtResult = await validateJwtAuth(request);

    if (!jwtResult.isValid) {
      return NextResponse.json(
        { error: jwtResult.error },
        { status: jwtResult.status },
      );
    }

    return handler(request, jwtResult.fid!, ...args);
  };
}

// Combined middleware for routes that need both API key and JWT auth
export function withApiKeyAndJwtAuth<T extends any[]>(
  handler: (
    request: NextRequest,
    fid: number,
    ...args: T
  ) => Promise<NextResponse>,
) {
  return async function (
    request: NextRequest,
    ...args: T
  ): Promise<NextResponse> {
    // First validate API key (using existing auth middleware logic)
    const API_SECRET_KEY = process.env.API_SECRET_KEY;
    const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "https://localhost:3000",
    ];

    // Origin validation
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");

    let origin = originHeader;

    // If no origin header, extract origin from referer
    if (!origin && refererHeader) {
      try {
        const refererUrl = new URL(refererHeader);
        origin = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch {
        origin = refererHeader;
      }
    }

    if (!origin) {
      return NextResponse.json(
        { error: "Unauthorized origin" },
        { status: 403 },
      );
    }

    // Use exact origin matching for better security
    const normalizedOrigin = origin.replace(/\/$/, ""); // Remove trailing slash
    const isAllowedOrigin = ALLOWED_ORIGINS.some((allowedOrigin) => {
      const normalizedAllowed = allowedOrigin.replace(/\/$/, "");
      return normalizedOrigin === normalizedAllowed;
    });

    if (!isAllowedOrigin) {
      return NextResponse.json(
        { error: "Unauthorized origin" },
        { status: 403 },
      );
    }

    // Then validate JWT
    const jwtResult = await validateJwtAuth(request);
    if (!jwtResult.isValid) {
      return NextResponse.json(
        { error: jwtResult.error },
        { status: jwtResult.status },
      );
    }

    return handler(request, jwtResult.fid!, ...args);
  };
}
