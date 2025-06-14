import { NextRequest, NextResponse } from "next/server";

const API_SECRET_KEY = process.env.API_SECRET_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
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

  if (
    !origin ||
    !ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin))
  ) {
    return {
      isValid: false,
      error: "Unauthorized origin",
      status: 403,
    };
  }

  // Security Check 2: API Key validation
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey || apiKey !== API_SECRET_KEY) {
    return {
      isValid: false,
      error: "Invalid or missing API key",
      status: 401,
    };
  }

  return { isValid: true };
}

export function createOptionsHandler() {
  return async function OPTIONS(request: NextRequest) {
    // Handle CORS preflight requests
    const origin = request.headers.get("origin");

    if (
      !origin ||
      !ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin))
    ) {
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
