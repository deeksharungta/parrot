import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { supabase } from "@/lib/supabase";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://four-readers-ask.loca.lt",
];

export interface InternalJwtAuthResult {
  isValid: boolean;
  fid?: number;
  error?: string;
  status?: number;
}

/**
 * Validate JWT token for internal requests (no API key required)
 */
export async function validateInternalJwtAuth(
  request: NextRequest,
): Promise<InternalJwtAuthResult> {
  try {
    // Origin validation first
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");

    let origin = originHeader;

    // If no origin header, extract origin from referer
    if (!origin && refererHeader) {
      try {
        const refererUrl = new URL(refererHeader);
        origin = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        // Invalid referer URL
        origin = refererHeader;
      }
    }

    if (!origin) {
      return {
        isValid: false,
        error: "Origin required for internal requests",
        status: 403,
      };
    }

    // Use exact origin matching for better security
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowedOrigin = ALLOWED_ORIGINS.some((allowedOrigin) => {
      const normalizedAllowed = allowedOrigin.replace(/\/$/, "");
      return normalizedOrigin === normalizedAllowed;
    });

    if (!isAllowedOrigin) {
      return {
        isValid: false,
        error: "Unauthorized origin",
        status: 403,
      };
    }

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
        error: "Unauthorized",
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
        error: "Unauthorized",
        status: 401,
      };
    }

    const fid = payload.fid as number;

    if (!fid) {
      return {
        isValid: false,
        error: "Unauthorized",
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

/**
 * Middleware for routes that need JWT auth but no API key (internal frontend requests)
 */
export function withInternalJwtAuth<T extends any[]>(
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
    const jwtResult = await validateInternalJwtAuth(request);

    if (!jwtResult.isValid) {
      return NextResponse.json(
        { error: jwtResult.error },
        { status: jwtResult.status },
      );
    }

    return handler(request, jwtResult.fid!, ...args);
  };
}

/**
 * Create OPTIONS handler for internal JWT endpoints
 */
export function createInternalJwtOptionsHandler() {
  return async function OPTIONS(request: NextRequest) {
    // Handle CORS preflight requests
    const originHeader = request.headers.get("origin");
    const refererHeader = request.headers.get("referer");

    let origin = originHeader;

    // If no origin header, extract origin from referer
    if (!origin && refererHeader) {
      try {
        const refererUrl = new URL(refererHeader);
        origin = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        // Invalid referer URL
        origin = refererHeader;
      }
    }

    if (!origin) {
      return new NextResponse(null, { status: 403 });
    }

    // Use exact origin matching for better security
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowedOrigin = ALLOWED_ORIGINS.some((allowedOrigin) => {
      const normalizedAllowed = allowedOrigin.replace(/\/$/, "");
      return normalizedOrigin === normalizedAllowed;
    });

    if (!isAllowedOrigin) {
      return new NextResponse(null, { status: 403 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  };
}
