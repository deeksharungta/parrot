import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Valid URL is required" },
        { status: 400 },
      );
    }

    // Only allow t.co URLs for security
    if (!url.startsWith("https://t.co/")) {
      return NextResponse.json(
        { error: "Only t.co URLs are allowed" },
        { status: 400 },
      );
    }

    try {
      // Use fetch with proper headers to resolve the URL
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const resolvedUrl = response.url;

      // If the resolved URL is still the same t.co URL, try with GET method
      if (resolvedUrl === url) {
        const getResponse = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        });

        return NextResponse.json({
          originalUrl: url,
          resolvedUrl: getResponse.url,
        });
      }

      return NextResponse.json({
        originalUrl: url,
        resolvedUrl: resolvedUrl,
      });
    } catch (error) {
      console.error(`Failed to resolve URL ${url}:`, error);
      return NextResponse.json({
        originalUrl: url,
        resolvedUrl: url, // Return original URL if resolution fails
        error: "Failed to resolve URL",
      });
    }
  } catch (error) {
    console.error("Error in URL resolution API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
