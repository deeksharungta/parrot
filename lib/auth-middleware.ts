import { NextRequest, NextResponse } from "next/server";

const API_SECRET_KEY = process.env.API_SECRET_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://localhost:3000",
  "https://four-readers-ask.loca.lt",
];

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  status?: number;
}

export function validateAuth(request: NextRequest): AuthValidationResult {
  // Security Check 1: Origin validation
  const origin =
    request.headers.get("origin") || request.headers.get("referer");

  if (!origin) {
    return {
      isValid: false,
      error: "Unauthorized origin",
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

export function createOptionsHandler() {
  return async function OPTIONS(request: NextRequest) {
    // Handle CORS preflight requests
    const origin = request.headers.get("origin");

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
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        "Access-Control-Max-Age": "86400", // 24 hours
      },
    });
  };
}

export function withAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
) {
  return async function (
    request: NextRequest,
    ...args: T
  ): Promise<NextResponse> {
    const authResult = validateAuth(request);

    if (!authResult.isValid) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status },
      );
    }

    return handler(request, ...args);
  };
}
