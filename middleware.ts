import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis for rate limiting (only if credentials are available)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limiter configuration
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(100, "1 m"), // 100 requests per minute
    })
  : null;

// API routes that require stricter rate limiting
const strictRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, "1 m"), // 10 requests per minute for sensitive operations
    })
  : null;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  // Apply rate limiting
  if (ratelimit && request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimitResult = await applyRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }
  }

  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Content Security Policy - Updated for Farcaster frame compatibility, PostHog, and Sentry
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://js.stripe.com https://us-assets.i.posthog.com https://*.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.neynar.com https://api.twitter.com https://t.co https://*.supabase.co wss://*.supabase.co https://vercel.live https://*.loca.lt https://mainnet.base.org https://*.base.org https://api.coinbase.com https://*.coinbase.com https://ethereum-mainnet.s.chainbase.online https://*.alchemy.com https://*.infura.io https://*.quicknode.com wss://mainnet.base.org wss://*.base.org https://react-tweet.vercel.app https://us.i.posthog.com https://us-assets.i.posthog.com https://*.posthog.com https://*.sentry.io",
    "worker-src 'self' blob:",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Allow framing from Farcaster-related domains and development tunnels
    "frame-ancestors 'self' https://warpcast.com https://*.warpcast.com https://farcaster.xyz https://*.farcaster.xyz https://*.vercel.app https://*.netlify.app https://*.loca.lt https://*.ngrok.io https://*.localhost.run",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // HSTS (only in production)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
}

async function applyRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (!ratelimit || !strictRatelimit) return null;

  const ip =
    request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const pathname = request.nextUrl.pathname;

  // Apply stricter rate limiting to sensitive endpoints
  const sensitiveEndpoints = ["/api/auth/", "/api/cast", "/api/cast-thread"];
  const isStrictEndpoint = sensitiveEndpoints.some((endpoint) =>
    pathname.startsWith(endpoint),
  );

  const limiter = isStrictEndpoint ? strictRatelimit : ratelimit;
  const { success, limit, reset, remaining } = await limiter.limit(ip);

  if (!success) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": new Date(reset).toISOString(),
      },
    });
  }

  return null;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
