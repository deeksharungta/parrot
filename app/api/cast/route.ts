import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  createPublicClient,
  createWalletClient,
  http,
  erc20Abi,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  parseTweetToFarcasterCast,
  getEmbedLimit,
  resolveTcoUrls,
  convertTwitterMentionsToFarcaster,
  checkUserProStatus,
} from "@/lib/cast-utils";
import { base } from "viem/chains";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constants";
import { TwitterApiTweet } from "@/lib/tweets-service";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";
import { decodeHtmlEntities } from "@/lib/utils/sanitization";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const CAST_COST = 0.1; // USDC

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

// Rate limiter for RapidAPI (5 requests per second)
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 10, timeWindowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove requests older than the time window
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow,
    );

    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 10; // Add 10ms buffer
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursively check again
    }

    // Record this request
    this.requests.push(now);
  }
}

// Global rate limiter instance for RapidAPI
const rapidApiRateLimiter = new RateLimiter(10, 1000);

// Helper function to check if tweet content is truncated
function isTweetTruncated(content: string): boolean {
  // For truncation checking, we'll be more conservative and not remove t.co links
  // since we don't have media context here, and we want to accurately measure content length
  return content.length >= 230;
}

// Helper function to remove the last t.co link if there's media
function removeLastTcoLinkIfMedia(content: string, hasMedia: boolean): string {
  if (!hasMedia) {
    return content;
  }

  // If there's media, only remove the last t.co link
  const tcoRegex = /https:\/\/t\.co\/\S+/g;
  const matches = Array.from(content.matchAll(tcoRegex));

  if (matches.length === 0) {
    return content;
  }

  // Only remove the last match
  const lastMatch = matches[matches.length - 1];
  if (lastMatch.index === undefined) {
    return content;
  }

  const beforeLastLink = content.substring(0, lastMatch.index);
  const afterLastLink = content.substring(
    lastMatch.index + lastMatch[0].length,
  );

  return (beforeLastLink + afterLastLink).trim();
}

// Helper function to fetch full tweet details for truncated tweets
async function fetchTweetDetails(
  tweetId: string,
): Promise<TwitterApiTweet | null> {
  try {
    if (!RAPIDAPI_KEY) {
      console.error("RapidAPI key not configured");
      return null;
    }

    // Wait for rate limit slot before making the API call
    await rapidApiRateLimiter.waitForSlot();

    // Direct RapidAPI call
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/tweet/details?tweet_id=${tweetId}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Error fetching tweet details:",
        response.status,
        errorText,
      );
      return null;
    }

    const tweetDetails = await response.json();
    return tweetDetails;
  } catch (error) {
    console.error("Error in fetchTweetDetails:", error);
    return null;
  }
}

export const OPTIONS = createOptionsHandler();

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const {
      tweetId,
      fid,
      content,
      mediaUrls,
      quotedTweetUrl,
      isRetweetRemoved,
      videoUrls,
      isEdit = false,
      channel_id,
    } = body;

    // Log incoming request parameters
    console.log("=== INCOMING CAST REQUEST ===");
    console.log("Authenticated FID:", authenticatedFid);
    console.log("Request body:", JSON.stringify(body, null, 2));
    console.log("=============================");

    if (!tweetId) {
      return NextResponse.json(
        { error: "tweetId is required" },
        { status: 400 },
      );
    }

    // Use the authenticated user's FID instead of the one from the request body
    const userFid = fid || authenticatedFid;

    // Authorization check: ensure the FID in the request matches the authenticated user
    if (fid && fid !== authenticatedFid) {
      return NextResponse.json(
        { error: "Unauthorized: You can only cast for your own account" },
        { status: 403 },
      );
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Get user from database to check wallet and spending approval
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("farcaster_fid", userFid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found or not registered" },
        { status: 404 },
      );
    }

    // Check if user has free casts first - if they do, skip USDC checks
    const hasFreeCasts = user.free_casts_left && user.free_casts_left > 0;

    if (!hasFreeCasts) {
      // Check if user has approved spending and has sufficient balance
      if (!user.spending_approved) {
        return NextResponse.json(
          {
            error: "USDC spending not approved. Please approve spending first.",
          },
          { status: 403 },
        );
      }

      if (!user.usdc_balance || user.usdc_balance < CAST_COST) {
        return NextResponse.json(
          { error: "Insufficient USDC balance. Please top up your account." },
          { status: 402 },
        );
      }
    }

    // Create public client for blockchain interactions
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Check onchain allowance using viem (skip if user has free casts)
    if (!hasFreeCasts) {
      if (!user.wallet_address) {
        return NextResponse.json(
          { error: "Wallet address not found for user" },
          { status: 400 },
        );
      }

      try {
        const allowance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "allowance",
          args: [user.wallet_address as `0x${string}`, SPENDER_ADDRESS],
        });

        const balance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [user.wallet_address as `0x${string}`],
        });

        const requiredAmount = parseUnits(CAST_COST.toString(), 6); // USDC has 6 decimals

        if (allowance < requiredAmount || balance < requiredAmount) {
          return NextResponse.json(
            {
              error:
                "Insufficient USDC allowance or balance. Please approve spending first.",
              requiredAllowance: CAST_COST,
              currentAllowance: Number(allowance) / 1000000, // Convert from wei to USDC
              currentBalance: Number(balance) / 1000000, // Convert from wei to USDC
            },
            { status: 403 },
          );
        }
      } catch (allowanceError) {
        console.error("Failed to check onchain allowance:", allowanceError);
        return NextResponse.json(
          { error: "Failed to verify onchain allowance" },
          { status: 500 },
        );
      }
    }

    // Get tweet data from database
    const { data: tweet, error: tweetError } = await supabase
      .from("tweets")
      .select("*")
      .eq("tweet_id", tweetId)
      .single();

    if (tweetError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Log initial tweet data from database
    console.log("=== DATABASE TWEET DATA ===");
    console.log("Tweet ID:", tweet.tweet_id);
    console.log("Content:", tweet.content);
    console.log("Media URLs:", tweet.media_urls);
    console.log("Is retweet:", tweet.is_retweet);
    console.log("Quoted tweet URL:", tweet.quoted_tweet_url);
    console.log("Twitter URL:", tweet.twitter_url);
    console.log("===========================");

    // Check if tweet content is truncated and fetch full details if needed
    let finalTweetContent = tweet.content;
    let updatedMediaUrls = tweet.media_urls;
    let fullTweetDetailsFetched = false;

    console.log("=== TRUNCATION CHECK ===");
    console.log("Is tweet truncated:", isTweetTruncated(tweet.content));
    console.log("Content length:", tweet.content.length);
    console.log("=========================");

    if (isTweetTruncated(tweet.content)) {
      console.log(
        `Tweet ${tweet.tweet_id} appears to be truncated, fetching full details...`,
      );
      const fullTweetDetails = await fetchTweetDetails(tweet.tweet_id);

      console.log("Full tweet details:", fullTweetDetails);

      if (fullTweetDetails && fullTweetDetails.text) {
        finalTweetContent = fullTweetDetails.text;
        fullTweetDetailsFetched = true;
        console.log(
          `Updated content for tweet ${tweet.tweet_id} with full text`,
        );

        console.log("=== FULL TWEET DETAILS PROCESSED ===");
        console.log("Original content:", tweet.content);
        console.log("Full content:", finalTweetContent);
        console.log(
          "Content length change:",
          finalTweetContent.length - tweet.content.length,
        );
        console.log("=====================================");

        // Also update media URLs from full details if available - using new simplified format
        let newMediaItems: Array<{ type: string; url: string }> = [];

        if (
          fullTweetDetails.media_url &&
          fullTweetDetails.media_url.length > 0
        ) {
          fullTweetDetails.media_url.forEach((url: string) => {
            newMediaItems.push({ type: "photo", url });
          });
        }

        if (
          fullTweetDetails.video_url &&
          fullTweetDetails.video_url.length > 0
        ) {
          fullTweetDetails.video_url.forEach((video: any) => {
            if (typeof video === "string") {
              newMediaItems.push({ type: "video", url: video });
            } else if (video.url) {
              newMediaItems.push({ type: "video", url: video.url });
            }
          });
        }

        if (newMediaItems.length > 0) {
          updatedMediaUrls = newMediaItems;
          console.log("=== MEDIA URLS UPDATED ===");
          console.log("Original media URLs:", tweet.media_urls);
          console.log("Updated media URLs:", updatedMediaUrls);
          console.log("==========================");
        }

        // Update the tweet in the database with the full content
        const { error: updateError } = await supabase
          .from("tweets")
          .update({
            content: finalTweetContent,
            media_urls: updatedMediaUrls,
            updated_at: new Date().toISOString(),
          })
          .eq("tweet_id", tweetId);

        if (updateError) {
          console.error(
            "Failed to update tweet with full content:",
            updateError,
          );
        }
      }
    }

    // Create updated tweet object for parsing
    const updatedTweet = {
      ...tweet,
      content: finalTweetContent,
      media_urls: updatedMediaUrls,
    };

    // Parse tweet content with potential overrides for edited values
    let parsedCast = await parseTweetToFarcasterCast(
      updatedTweet,
      isEdit,
      fullTweetDetailsFetched,
    );

    console.log("=== INITIAL PARSED CAST ===");
    console.log("Parsed content:", parsedCast.content);
    console.log("Parsed embeds:", parsedCast.embeds);
    console.log("===========================");

    // Override with edited values if provided
    if (
      content !== undefined ||
      mediaUrls !== undefined ||
      quotedTweetUrl !== undefined ||
      videoUrls !== undefined
    ) {
      console.log("=== OVERRIDE LOGIC TRIGGERED ===");
      console.log("Content override provided:", content !== undefined);
      console.log("Media URLs override provided:", mediaUrls !== undefined);
      console.log(
        "Quoted tweet URL override provided:",
        quotedTweetUrl !== undefined,
      );
      console.log("Video URLs override provided:", videoUrls !== undefined);
      console.log("Is edit mode:", isEdit);
      console.log("=================================");
      const embeds: string[] = [];

      if (tweet.is_retweet) {
        // For retweets, preserve user-added commentary if provided, otherwise keep empty
        if (content !== undefined && content.trim().length > 0) {
          parsedCast.content = decodeHtmlEntities(content);
        } else {
          parsedCast.content = "";
        }

        if (!isRetweetRemoved) {
          embeds.push(tweet.twitter_url || "");
        }
      } else {
        // Use edited content if provided AND it's longer than database content OR it's an explicit edit
        if (content !== undefined) {
          // Only override if:
          // 1. This is an explicit edit (isEdit = true), OR
          // 2. The provided content is longer than the parsed content (indicating it's a genuine override)
          // 3. Otherwise, keep the full database content to avoid truncation
          if (isEdit || content.length > parsedCast.content.length) {
            console.log("=== CONTENT OVERRIDE DECISION ===");
            console.log("User provided content:", content);
            console.log("Original tweet content:", tweet.content);
            console.log("Content matches original:", content === tweet.content);
            console.log("Full tweet content:", finalTweetContent);

            // If the user provided content is the same as the original tweet content (with t.co),
            // use the full content instead. Otherwise, use the user's provided content.
            if (content === tweet.content) {
              // User provided the original truncated content, use the full content
              parsedCast.content = decodeHtmlEntities(finalTweetContent);
              console.log("Using full content (user provided original)");
            } else {
              // User provided custom content, use it
              parsedCast.content = decodeHtmlEntities(content);
              console.log("Using user's custom content");
            }
            console.log("Final parsed content:", parsedCast.content);
            console.log("================================");
          }
        }

        // Use provided quoted tweet URL or fall back to database value
        const finalQuotedTweetUrl =
          quotedTweetUrl !== undefined
            ? quotedTweetUrl
            : tweet.quoted_tweet_url;
        if (finalQuotedTweetUrl) {
          embeds.push(finalQuotedTweetUrl);
        }

        // Use provided media URLs or fall back to database value
        const finalMediaUrls =
          mediaUrls !== undefined ? mediaUrls : tweet.media_urls;
        const finalVideoUrls =
          videoUrls !== undefined ? videoUrls : tweet.media_urls?.videos || [];

        if (finalMediaUrls || finalVideoUrls.length > 0) {
          // Handle new structure with images and videos
          if (
            typeof finalMediaUrls === "object" &&
            !Array.isArray(finalMediaUrls)
          ) {
            // Handle images
            if (finalMediaUrls.images && Array.isArray(finalMediaUrls.images)) {
              finalMediaUrls.images.forEach((url: string) => {
                if (url && url.trim()) {
                  embeds.push(url);
                }
              });
            }

            // Handle videos from database structure
            if (finalMediaUrls.videos && Array.isArray(finalMediaUrls.videos)) {
              finalMediaUrls.videos.forEach((video: any) => {
                if (video && video.url && video.url.trim()) {
                  embeds.push(video.url);
                }
              });
            }
          }

          // Handle videos from edit parameters
          if (finalVideoUrls && finalVideoUrls.length > 0) {
            finalVideoUrls.forEach((video: any) => {
              if (video && video.url && video.url.trim()) {
                embeds.push(video.url);
              }
            });
          }

          // Handle legacy media format (if not already handled above)
          if (finalMediaUrls && Array.isArray(finalMediaUrls)) {
            finalMediaUrls.forEach((item: any) => {
              if (typeof item === "string" && item.trim()) {
                // Old format: array of strings
                embeds.push(item);
              } else if (
                item &&
                typeof item === "object" &&
                item.url &&
                item.url.trim()
              ) {
                // New format: array of objects with url and type
                embeds.push(item.url);
              }
            });
          }
        }
      }

      // Check user's embed limit based on pro subscription status
      const embedLimit = await getEmbedLimit(userFid);
      console.log("=== EMBED LIMIT CHECK ===");
      console.log("Embed limit:", embedLimit);
      console.log("Embeds before limit:", embeds);
      console.log("Embed count before limit:", embeds.length);

      if (embeds.length > embedLimit) {
        embeds.splice(embedLimit);
        console.log("Embeds truncated to limit");
      }

      console.log("Final embeds:", embeds);
      console.log("Final embed count:", embeds.length);
      console.log("========================");

      // Remove last t.co link if there are media embeds (but not if full tweet details were fetched)
      if (
        content !== undefined &&
        embeds.length > 0 &&
        !fullTweetDetailsFetched
      ) {
        console.log("=== REMOVING T.CO LINK ===");
        console.log("Content before t.co removal:", parsedCast.content);
        parsedCast.content = removeLastTcoLinkIfMedia(parsedCast.content, true);
        console.log("Content after t.co removal:", parsedCast.content);
        console.log("==========================");
      }

      // Update the parsed cast with the new embeds
      parsedCast = {
        ...parsedCast,
        embeds,
      };

      console.log("=== PARSED CAST UPDATED WITH EMBEDS ===");
      console.log("Updated content:", parsedCast.content);
      console.log("Updated embeds:", parsedCast.embeds);
      console.log("=======================================");
    }

    // Resolve any t.co URLs in the content before casting
    let resolvedContent = await resolveTcoUrls(parsedCast.content);

    console.log("=== URL RESOLUTION ===");
    console.log("Content before URL resolution:", parsedCast.content);
    console.log("Content after URL resolution:", resolvedContent);
    console.log(
      "URL resolution changed content:",
      resolvedContent !== parsedCast.content,
    );
    console.log("======================");

    // Remove Twitter photo/video URLs from content if there are media embeds
    // This handles cases where t.co links resolve to twitter.com/.../status/.../photo/1 etc
    if (parsedCast.embeds && parsedCast.embeds.length > 0) {
      const hasMediaEmbed = parsedCast.embeds.some((embed) => {
        return (
          embed.includes("pbs.twimg.com") ||
          embed.includes(".jpg") ||
          embed.includes(".png") ||
          embed.includes(".gif") ||
          embed.includes(".mp4")
        );
      });

      if (hasMediaEmbed) {
        // Remove Twitter photo/video URLs from the text
        const twitterPhotoVideoRegex =
          /https?:\/\/(?:twitter\.com|x\.com)\/[^\/]+\/status\/\d+\/(?:photo|video)\/\d+/g;
        const contentBeforeRemoval = resolvedContent;
        resolvedContent = resolvedContent
          .replace(twitterPhotoVideoRegex, "")
          .trim();

        console.log("=== TWITTER PHOTO/VIDEO URL REMOVAL ===");
        console.log("Has media embed:", hasMediaEmbed);
        console.log("Content before removal:", contentBeforeRemoval);
        console.log("Content after removal:", resolvedContent);
        console.log("========================================");
      }
    }

    // Extract and embed regular URLs from resolved content (lowest priority)
    // Only do this if we used the override logic (when any override params were provided)
    if (
      content !== undefined ||
      mediaUrls !== undefined ||
      quotedTweetUrl !== undefined ||
      videoUrls !== undefined
    ) {
      const urlRegex =
        /https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?/g;
      const matches = Array.from(resolvedContent.matchAll(urlRegex));
      const contentUrls = matches
        .map((match) => match[0])
        .filter((url) => {
          try {
            new URL(url);
            // Filter out Twitter photo/video URLs that have the pattern status/<tweetid>/photo or status/<tweetid>/video
            if (
              url.includes("/status/") &&
              (url.includes("/photo/") || url.includes("/video/"))
            ) {
              return false;
            }
            return true;
          } catch {
            return false;
          }
        });

      // Add URLs as embeds with lowest priority
      contentUrls.forEach((url) => {
        parsedCast.embeds.push(url);
      });

      console.log("=== CONTENT URL EXTRACTION ===");
      console.log("URLs found in content:", contentUrls);
      console.log("Embeds after adding content URLs:", parsedCast.embeds);
      console.log("=================================");

      // Re-apply embed limit after adding content links
      const embedLimit = await getEmbedLimit(userFid);
      if (parsedCast.embeds.length > embedLimit) {
        parsedCast.embeds.splice(embedLimit);
        console.log("Embeds truncated after content URL addition");
      }
    }

    // Convert Twitter mentions to Farcaster format
    const convertedContent = await convertTwitterMentionsToFarcaster(
      resolvedContent,
      isEdit,
      tweet.original_content || undefined,
    );

    console.log("=== MENTION CONVERSION ===");
    console.log("Content before mention conversion:", resolvedContent);
    console.log("Content after mention conversion:", convertedContent);
    console.log(
      "Mention conversion changed content:",
      convertedContent !== resolvedContent,
    );
    console.log("==========================");

    // Check user's pro status and truncate text accordingly
    const isProUser = await checkUserProStatus(userFid);
    const textLimit = isProUser ? 10000 : 1024;
    const truncatedContent =
      convertedContent.length > textLimit
        ? convertedContent.substring(0, textLimit)
        : convertedContent;

    console.log("=== PRO STATUS & TEXT TRUNCATION ===");
    console.log("Is pro user:", isProUser);
    console.log("Text limit:", textLimit);
    console.log("Content before truncation:", convertedContent);
    console.log("Content after truncation:", truncatedContent);
    console.log(
      "Content was truncated:",
      truncatedContent.length < convertedContent.length,
    );
    console.log("Content length:", truncatedContent.length);
    console.log("====================================");

    // Log what we're about to cast
    console.log("=== CASTING DETAILS ===");
    console.log("Tweet ID:", tweetId);
    console.log("User FID:", userFid);
    console.log("Channel ID:", channel_id || "none (home feed)");
    console.log("Original tweet content:", tweet.content);
    console.log("Final resolved content:", resolvedContent);
    console.log("Converted content (mentions):", convertedContent);
    console.log("Final truncated content:", truncatedContent);
    console.log("Content length:", truncatedContent.length);
    console.log("Text limit:", textLimit);
    console.log("Is pro user:", isProUser);
    console.log("Embeds:", parsedCast.embeds);
    console.log("Embed count:", parsedCast.embeds?.length || 0);
    console.log("Is retweet:", tweet.is_retweet);
    console.log("Has quoted tweet:", !!tweet.quoted_tweet_url);
    console.log("Media URLs:", tweet.media_urls);
    console.log("========================");

    // Cast to Farcaster using Neynar API (AFTER payment is confirmed)
    const castPayload: any = {
      signer_uuid: user.neynar_signer_uuid,
      text: truncatedContent,
    };

    // Add channel_id if provided (not for home feed)
    if (channel_id && channel_id.trim() !== "") {
      castPayload.channel_id = channel_id;
    }

    // Add embeds if available (images, quoted tweets, etc.)
    if (parsedCast.embeds && parsedCast.embeds.length > 0) {
      castPayload.embeds = parsedCast.embeds.map((url) => ({ url }));
    }

    if (
      !tweet.is_retweet &&
      !tweet.quoted_tweet_url &&
      tweet.media_urls &&
      typeof tweet.media_urls === "object"
    ) {
      const hasVideo =
        tweet.media_urls.videos &&
        Array.isArray(tweet.media_urls.videos) &&
        tweet.media_urls.videos.length > 0;
      const hasGif =
        tweet.media_urls.types &&
        Array.isArray(tweet.media_urls.types) &&
        tweet.media_urls.types.includes("animated_gif");

      console.log("=== VIDEO/GIF CHECK ===");
      console.log("Has video:", hasVideo);
      console.log("Has GIF:", hasGif);
      console.log("Media URLs:", tweet.media_urls);
      console.log("======================");

      if (hasVideo || hasGif) {
        console.log("=== VIDEO/GIF HANDLING ===");
        console.log("Original cast payload:", castPayload);
        castPayload.embeds = [{ url: tweet.twitter_url || "" }];
        castPayload.text = "";
        console.log("Modified cast payload for video/GIF:", castPayload);
        console.log("==========================");
      }
    }

    // Log the final cast payload being sent to Neynar
    console.log("=== FINAL CAST PAYLOAD ===");
    console.log("Cast payload:", JSON.stringify(castPayload, null, 2));
    console.log("==========================");

    const castResponse = await fetch(`${NEYNAR_BASE_URL}/farcaster/cast`, {
      method: "POST",
      headers: {
        "x-api-key": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(castPayload),
    });

    if (!castResponse.ok) {
      const errorText = await castResponse.text();
      console.error("Neynar cast error:", castResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to cast to Farcaster" },
        { status: castResponse.status },
      );
    }

    const castData = await castResponse.json();

    // Log the Neynar API response
    console.log("=== NEYNAR API RESPONSE ===");
    console.log("Response status:", castResponse.status);
    console.log("Response data:", JSON.stringify(castData, null, 2));
    console.log("===========================");

    // Process payment or deduct free cast
    let newBalance = user.usdc_balance || 0;
    let newTotalSpent = user.total_spent || 0;
    let newFreeCastsLeft = user.free_casts_left || 0;
    let transactionHash = null;

    if (hasFreeCasts) {
      // Deduct from free casts
      newFreeCastsLeft = newFreeCastsLeft - 1;
    } else {
      // Process USDC payment
      newBalance = newBalance - CAST_COST;
      newTotalSpent = newTotalSpent + CAST_COST;

      // Execute actual USDC payment via blockchain transaction
      try {
        const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

        if (!privateKey) {
          console.error("Private key not configured");
          return NextResponse.json(
            { error: "Payment system not configured" },
            { status: 500 },
          );
        }

        const account = privateKeyToAccount(privateKey);

        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: http(),
        });

        // Convert amount to proper USDC units (6 decimals)
        const amountInUnits = parseUnits(CAST_COST.toString(), 6);

        // Get the current nonce to avoid conflicts with concurrent transactions
        const nonce = await publicClient.getTransactionCount({
          address: account.address,
          blockTag: "pending",
        });

        transactionHash = await walletClient.writeContract({
          address: USDC_ADDRESS,
          abi: erc20Abi,
          functionName: "transferFrom",
          args: [
            user.wallet_address as `0x${string}`,
            SPENDER_ADDRESS,
            amountInUnits,
          ],
          nonce,
        });
      } catch (paymentError) {
        console.error("Payment processing error:", paymentError);
        return NextResponse.json(
          { error: "Failed to process USDC payment" },
          { status: 500 },
        );
      }
    }

    // Update user balance, total spent, and free casts
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        usdc_balance: newBalance,
        total_spent: newTotalSpent,
        free_casts_left: newFreeCastsLeft,
        updated_at: new Date().toISOString(),
      })
      .eq("farcaster_fid", userFid);

    if (updateUserError) {
      console.error("Failed to update user balance:", updateUserError);
      return NextResponse.json(
        { error: "Failed to update user balance after payment" },
        { status: 500 },
      );
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        tweet_id: tweet.id,
        transaction_type: hasFreeCasts ? "free_cast" : "cast_payment",
        amount: hasFreeCasts ? 0 : CAST_COST,
        currency: hasFreeCasts ? null : "USDC",
        status: "completed",
        transaction_hash: transactionHash,
        description: hasFreeCasts
          ? `Free cast to Farcaster`
          : `Payment for casting tweet to Farcaster`,
        metadata: {
          cast_hash: castData.cast?.hash,
          fid: userFid,
          cast_url: `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castData.cast?.hash?.slice(0, 10) || "cast"}`,
          payment_transaction_hash: transactionHash,
          is_free_cast: hasFreeCasts,
        },
      });

    if (transactionError) {
      console.error("Failed to create transaction record:", transactionError);
      // Don't fail the entire operation if transaction logging fails
    }

    // Update tweet status in database
    const castUrl = `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castData.cast?.hash?.slice(0, 10) || "cast"}`;

    const { error: tweetUpdateError } = await supabase
      .from("tweets")
      .update({
        cast_status: "cast",
        cast_hash: castData.cast?.hash,
        cast_created_at: new Date().toISOString(),
        cast_price: hasFreeCasts ? 0 : CAST_COST,
        payment_approved: true,
        payment_processed: !hasFreeCasts, // Only mark as processed if payment was actually made
        updated_at: new Date().toISOString(),
      })
      .eq("tweet_id", tweetId);

    if (tweetUpdateError) {
      console.error("Failed to update tweet status:", tweetUpdateError);
      // Don't fail the entire operation if tweet update fails
    }

    const response = NextResponse.json({
      success: true,
      message: hasFreeCasts
        ? "Tweet successfully casted to Farcaster using free cast"
        : "Tweet successfully casted to Farcaster and payment processed",
      castHash: castData.cast?.hash,
      castUrl,
      cost: hasFreeCasts ? 0 : CAST_COST,
      usedFreeCast: hasFreeCasts,
      freeCastsRemaining: hasFreeCasts
        ? newFreeCastsLeft
        : user.free_casts_left,
    });

    // Add CORS headers
    const origin = request.headers.get("origin") || "*";
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "POST");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, x-api-key",
    );

    return response;
  } catch (error) {
    console.error("Error casting tweet:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
