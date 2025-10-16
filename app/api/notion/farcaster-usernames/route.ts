import { NextResponse } from "next/server";
import { NotionFarcasterService } from "@/lib/notion-farcaster-service";

export async function GET() {
  try {
    const notionService = new NotionFarcasterService();
    const [data, mapping] = await Promise.all([
      notionService.getAllMappings(),
      notionService.getUsernameMappingObject(),
    ]);

    return NextResponse.json({
      data,
      mapping,
      total: data.length,
    });
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data from Notion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Helper function to get Farcaster username by X username
export async function POST(request: Request) {
  try {
    const { xUsername } = await request.json();

    if (!xUsername) {
      return NextResponse.json(
        { error: "X username is required" },
        { status: 400 },
      );
    }

    const notionService = new NotionFarcasterService();
    const mapping = await notionService.getMappingByXUsername(xUsername);

    if (!mapping) {
      return NextResponse.json(
        { error: "No matching Farcaster username found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      xUsername: mapping.x_username,
      farcasterUsername: mapping.farcaster_username,
      id: mapping.id,
    });
  } catch (error) {
    console.error("Notion API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch data from Notion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
