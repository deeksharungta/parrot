import { NextRequest, NextResponse } from "next/server";
import { convertTwitterMentionsToFarcaster } from "@/lib/cast-utils";

export async function POST(request: NextRequest) {
  try {
    const { content, useCache = true, originalContent } = await request.json();

    console.log("Converting Twitter mentions to Farcaster:", content);

    // Validate input
    if (!content || typeof content !== "string") {
      console.log("Invalid content provided:", content);
      return NextResponse.json(
        {
          success: false,
          error: "Valid content string is required",
          originalContent: content,
        },
        { status: 400 },
      );
    }

    try {
      // Convert Twitter mentions to Farcaster format
      const convertedContent = await convertTwitterMentionsToFarcaster(
        content,
        useCache,
        originalContent,
      );

      console.log(
        "Mention conversion result:",
        content,
        "->",
        convertedContent,
      );

      return NextResponse.json({
        success: true,
        convertedContent,
        originalContent: content,
      });
    } catch (conversionError) {
      console.error("Error converting mentions:", conversionError);

      // Return original content if conversion fails
      return NextResponse.json({
        success: false,
        convertedContent: content,
        originalContent: content,
        error: "Could not convert Twitter mentions",
        details:
          conversionError instanceof Error
            ? conversionError.message
            : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error in convert-mentions API:", error);
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
