import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";

export const OPTIONS = createOptionsHandler();

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
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

    // Get the current tweet and verify ownership
    const { data: currentTweet, error: fetchError } = await supabase
      .from("tweets")
      .select(
        `
        *,
        users!inner(
          id,
          farcaster_fid
        )
      `,
      )
      .eq("tweet_id", tweetId)
      .single();

    if (fetchError || !currentTweet) {
      console.error("Error fetching tweet:", fetchError);
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    console.log("currentTweet", currentTweet);
    console.log("authenticatedFid", authenticatedFid);
    // Authorization check: ensure user owns this tweet
    if (currentTweet.users.farcaster_fid !== authenticatedFid) {
      return NextResponse.json(
        { error: "Unauthorized: You can only edit your own tweets" },
        { status: 403 },
      );
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
      // Handle new format: Array<{url: string, type: string}>
      const mediaArray: Array<{ url: string; type: string }> = [];

      // Process mediaUrls (can be images, photos, gifs)
      if (mediaUrls && mediaUrls.length > 0) {
        mediaUrls.forEach((item: any) => {
          if (typeof item === "string") {
            // Legacy format: array of strings
            mediaArray.push({ url: item, type: "photo" });
          } else if (item && typeof item === "object" && item.url) {
            // New format: array of objects with url and type
            mediaArray.push({
              url: item.url,
              type: item.type || "photo",
            });
          }
        });
      }

      // Process videoUrls
      if (videoUrls && videoUrls.length > 0) {
        videoUrls.forEach((video: any) => {
          if (video && video.url) {
            mediaArray.push({ url: video.url, type: "video" });
          }
        });
      }

      // Store in the new unified format
      updateData.media_urls = mediaArray.length > 0 ? mediaArray : null;
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
