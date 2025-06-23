import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    console.log("Attempting to resolve t.co URL:", url);

    // Validate that this is a t.co URL for security
    if (!url || !url.startsWith("https://t.co/")) {
      console.log("Invalid URL - not a t.co URL:", url);
      return NextResponse.json(
        {
          success: false,
          error: "Only t.co URLs are allowed",
          originalUrl: url,
        },
        { status: 400 },
      );
    }

    // Strategy 1: HEAD request with browser-like headers
    try {
      console.log("Trying HEAD request with browser headers");
      const headResponse = await fetch(url, {
        method: "HEAD",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          DNT: "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Cache-Control": "max-age=0",
        },
        redirect: "manual",
      });

      console.log("HEAD response status:", headResponse.status);
      console.log(
        "HEAD response headers:",
        Object.fromEntries(headResponse.headers.entries()),
      );

      if (headResponse.status >= 300 && headResponse.status < 400) {
        const location = headResponse.headers.get("location");
        if (location && location !== url) {
          console.log("HEAD request resolved:", url, "->", location);
          return NextResponse.json({
            success: true,
            resolvedUrl: location,
            originalUrl: url,
            method: "HEAD",
          });
        }
      }
    } catch (error) {
      console.log("HEAD request failed:", error);
    }

    // Strategy 2: GET request with different User-Agent
    try {
      console.log("Trying GET request with Twitter client headers");
      const getResponse = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "TwitterAndroid/10.21.0 (29950110-r-840) ONEPLUS+A6013/9 (OnePlus;ONEPLUS+A6013;OnePlus;OnePlus6T;0;;1;2018)",
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
        },
        redirect: "manual",
      });

      console.log("GET response status:", getResponse.status);
      console.log(
        "GET response headers:",
        Object.fromEntries(getResponse.headers.entries()),
      );

      if (getResponse.status >= 300 && getResponse.status < 400) {
        const location = getResponse.headers.get("location");
        if (location && location !== url) {
          console.log("GET request resolved:", url, "->", location);
          return NextResponse.json({
            success: true,
            resolvedUrl: location,
            originalUrl: url,
            method: "GET",
          });
        }
      }
    } catch (error) {
      console.log("GET request failed:", error);
    }

    // Strategy 3: GET request with cURL-like headers
    try {
      console.log("Trying GET request with cURL headers");
      const curlResponse = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "curl/7.68.0",
          Accept: "*/*",
        },
        redirect: "manual",
      });

      console.log("cURL response status:", curlResponse.status);

      if (curlResponse.status >= 300 && curlResponse.status < 400) {
        const location = curlResponse.headers.get("location");
        if (location && location !== url) {
          console.log("cURL request resolved:", url, "->", location);
          return NextResponse.json({
            success: true,
            resolvedUrl: location,
            originalUrl: url,
            method: "cURL",
          });
        }
      }
    } catch (error) {
      console.log("cURL request failed:", error);
    }

    // Strategy 4: Follow redirects automatically and check final URL
    try {
      console.log("Trying automatic redirect following");
      const finalResponse = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow", // Let fetch follow redirects automatically
      });

      const finalUrl = finalResponse.url;
      console.log("Final URL after redirects:", finalUrl);

      if (finalUrl && finalUrl !== url) {
        console.log("Automatic redirect resolved:", url, "->", finalUrl);
        return NextResponse.json({
          success: true,
          resolvedUrl: finalUrl,
          originalUrl: url,
          method: "auto-redirect",
        });
      }
    } catch (error) {
      console.log("Automatic redirect failed:", error);
    }

    // If all strategies fail, return the original URL
    console.log("Could not resolve URL:", url, ", returning original");
    return NextResponse.json({
      success: false,
      resolvedUrl: url,
      originalUrl: url,
      error: "Could not resolve t.co URL - all strategies failed",
    });
  } catch (error) {
    console.error("Error in resolve-url API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
