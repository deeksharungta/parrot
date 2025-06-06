import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tweetId, content } = body;

    if (!tweetId || !content) {
      return NextResponse.json(
        { error: "tweetId and content are required" },
        { status: 400 },
      );
    }

    // Get the current tweet to increment edit count
    const { data: currentTweet, error: fetchError } = await supabase
      .from("tweets")
      .select("edit_count")
      .eq("id", tweetId)
      .single();

    if (fetchError || !currentTweet) {
      console.error("Error fetching tweet:", fetchError);
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Update tweet with edited content
    const { data: updatedTweet, error: updateError } = await supabase
      .from("tweets")
      .update({
        content: content,
        is_edited: true,
        edit_count: (currentTweet.edit_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tweetId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating tweet:", updateError);
      return NextResponse.json(
        { error: "Failed to save edited content" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tweet content saved successfully",
      tweet: updatedTweet,
    });
  } catch (error) {
    console.error("Error saving edited tweet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
