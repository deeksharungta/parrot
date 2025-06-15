import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://four-readers-ask.loca.lt",
];

export interface InternalAuthResult {
  isValid: boolean;
  error?: string;
  status?: number;
}

/**
 * Middleware for internal frontend-to-backend communication
 * Only validates origin, doesn't require API keys
 */
export function validateInternalAuth(request: NextRequest): InternalAuthResult {
  // Security Check: Origin validation only
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
  const normalizedOrigin = origin.replace(/\/$/, ""); // Remove trailing slash
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

  return { isValid: true };
}

/**
 * Middleware wrapper for internal frontend requests
 */
export function withInternalAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  return async function (
    request: NextRequest,
    ...args: T
  ): Promise<NextResponse> {
    const authResult = validateInternalAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Create OPTIONS handler for internal endpoints
 */
export function createInternalOptionsHandler() {
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
    const normalizedOrigin = origin.replace(/\/$/, ""); // Remove trailing slash
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
