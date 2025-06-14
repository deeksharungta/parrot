import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";

export const OPTIONS = createOptionsHandler();

export const POST = withAuth(async function (request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tweetId,
      content,
      mediaUrls,
      quotedTweetUrl,
      isRetweetRemoved,
      videoUrls,
    } = body;

    if (!tweetId || content === undefined) {
      return NextResponse.json(
        { error: "tweetId and content are required" },
        { status: 400 },
      );
    }

    // Get the current tweet to increment edit count
    const { data: currentTweet, error: fetchError } = await supabase
      .from("tweets")
      .select("edit_count")
      .eq("tweet_id", tweetId)
      .single();

    if (fetchError || !currentTweet) {
      console.error("Error fetching tweet:", fetchError);
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      content: content,
      is_edited: true,
      edit_count: (currentTweet.edit_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    // Update media URLs if provided - handle both images and videos
    if (mediaUrls !== undefined || videoUrls !== undefined) {
      const mediaData: Record<string, any> = {};

      if (mediaUrls && mediaUrls.length > 0) {
        mediaData.images = mediaUrls;
      }

      if (videoUrls && videoUrls.length > 0) {
        mediaData.videos = videoUrls;
      }

      // Only store media_urls if we have any media
      updateData.media_urls =
        Object.keys(mediaData).length > 0 ? mediaData : null;
    }

    // Update quoted tweet URL if provided
    if (quotedTweetUrl !== undefined) {
      updateData.quoted_tweet_url = quotedTweetUrl;
    }

    if (isRetweetRemoved) {
      updateData.retweet_tweet_id = null;
    }

    // Update tweet with edited content
    const { data: updatedTweet, error: updateError } = await supabase
      .from("tweets")
      .update(updateData)
      .eq("tweet_id", tweetId)
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
});
