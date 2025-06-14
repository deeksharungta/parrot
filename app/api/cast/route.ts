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
import { parseTweetToFarcasterCast } from "@/lib/cast-utils";
import { base } from "viem/chains";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constants";
import { TwitterApiTweet } from "@/lib/tweets-service";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";

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

  constructor(maxRequests: number = 5, timeWindowMs: number = 1000) {
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
const rapidApiRateLimiter = new RateLimiter(5, 1000);

// Helper function to check if tweet content is truncated
function isTweetTruncated(content: string): boolean {
  // Remove https://t.co URLs from content to get actual text length
  const contentWithoutUrls = content.replace(/https:\/\/t\.co\/\w+/g, "");
  return contentWithoutUrls.length >= 278;
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

export const POST = withAuth(async function (request: NextRequest) {
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
    } = body;

    if (!tweetId || !fid) {
      return NextResponse.json(
        { error: "tweetId and fid are required" },
        { status: 400 },
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
      .eq("farcaster_fid", fid)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found or not registered" },
        { status: 404 },
      );
    }

    // Check if user has approved spending and has sufficient balance
    if (!user.spending_approved) {
      return NextResponse.json(
        { error: "USDC spending not approved. Please approve spending first." },
        { status: 403 },
      );
    }

    if (!user.usdc_balance || user.usdc_balance < CAST_COST) {
      return NextResponse.json(
        { error: "Insufficient USDC balance. Please top up your account." },
        { status: 402 },
      );
    }

    // Check onchain allowance using viem
    if (!user.wallet_address) {
      return NextResponse.json(
        { error: "Wallet address not found for user" },
        { status: 400 },
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

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

      console.log(`Allowance check passed: ${allowance} >= ${requiredAmount}`);
    } catch (allowanceError) {
      console.error("Failed to check onchain allowance:", allowanceError);
      return NextResponse.json(
        { error: "Failed to verify onchain allowance" },
        { status: 500 },
      );
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

    // Check if tweet content is truncated and fetch full details if needed
    let finalTweetContent = tweet.content;
    let updatedMediaUrls = tweet.media_urls;

    if (isTweetTruncated(tweet.content)) {
      console.log(
        `Tweet ${tweet.tweet_id} appears to be truncated, fetching full details...`,
      );
      const fullTweetDetails = await fetchTweetDetails(tweet.tweet_id);

      if (fullTweetDetails && fullTweetDetails.text) {
        finalTweetContent = fullTweetDetails.text;
        console.log(
          `Updated content for tweet ${tweet.tweet_id} with full text`,
        );

        // Also update media URLs from full details if available
        const newMediaUrls: Record<string, any> = {};
        if (
          fullTweetDetails.media_url &&
          fullTweetDetails.media_url.length > 0
        ) {
          newMediaUrls.images = fullTweetDetails.media_url;
        }
        if (
          fullTweetDetails.video_url &&
          fullTweetDetails.video_url.length > 0
        ) {
          newMediaUrls.videos = fullTweetDetails.video_url;
        }

        if (Object.keys(newMediaUrls).length > 0) {
          updatedMediaUrls = newMediaUrls;
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
    let parsedCast = await parseTweetToFarcasterCast(updatedTweet);

    // Override with edited values if provided
    if (
      mediaUrls !== undefined ||
      quotedTweetUrl !== undefined ||
      videoUrls !== undefined
    ) {
      console.log("mediaUrls", mediaUrls);
      console.log("quotedTweetUrl", quotedTweetUrl);

      const embeds: string[] = [];

      if (tweet.is_retweet) {
        if (content && content.trim().length > 0) {
          parsedCast.content = content;
        }

        if (!isRetweetRemoved) {
          embeds.push(tweet.twitter_url || "");
        }
      } else {
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
            finalMediaUrls.forEach((url: any) => {
              if (typeof url === "string" && url.trim()) {
                embeds.push(url);
              }
            });
          }
        }
      }

      console.log("embeds", embeds);

      // Update the parsed cast with the new embeds
      parsedCast = {
        ...parsedCast,
        embeds,
      };
    }

    // Cast to Farcaster using Neynar API (AFTER payment is confirmed)
    const castPayload: any = {
      signer_uuid: user.neynar_signer_uuid,
      text: parsedCast.content,
    };

    // Add embeds if available (images, quoted tweets, etc.)
    if (parsedCast.embeds && parsedCast.embeds.length > 0) {
      castPayload.embeds = parsedCast.embeds.map((url) => ({ url }));
    }

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

    // Process payment FIRST (0.1 USDC)
    const newBalance = (user.usdc_balance || 0) - CAST_COST;
    const newTotalSpent = (user.total_spent || 0) + CAST_COST;

    // Execute actual USDC payment via blockchain transaction
    let transactionHash = null;
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

      console.log("amountInUnits", amountInUnits);

      transactionHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "transferFrom",
        args: [
          user.wallet_address as `0x${string}`,
          SPENDER_ADDRESS,
          amountInUnits,
        ],
      });

      console.log("transactionHash", transactionHash);

      console.log("Payment transaction successful:", transactionHash);
    } catch (paymentError) {
      console.error("Payment processing error:", paymentError);
      return NextResponse.json(
        { error: "Failed to process USDC payment" },
        { status: 500 },
      );
    }

    // Update user balance and total spent in a transaction
    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        usdc_balance: newBalance,
        total_spent: newTotalSpent,
        updated_at: new Date().toISOString(),
      })
      .eq("farcaster_fid", fid);

    if (updateUserError) {
      console.error("Failed to update user balance:", updateUserError);
      return NextResponse.json(
        { error: "Failed to update user balance after payment" },
        { status: 500 },
      );
    }

    // Create transaction record with blockchain transaction hash
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        tweet_id: tweet.id,
        transaction_type: "cast_payment",
        amount: CAST_COST,
        currency: "USDC",
        status: "completed",
        transaction_hash: transactionHash,
        description: `Payment for casting tweet to Farcaster`,
        metadata: {
          cast_hash: castData.cast?.hash,
          fid: fid,
          cast_url: `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castData.cast?.hash?.slice(0, 10) || "cast"}`,
          payment_transaction_hash: transactionHash,
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
        cast_price: CAST_COST,
        payment_approved: true,
        payment_processed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("tweet_id", tweetId);

    if (tweetUpdateError) {
      console.error("Failed to update tweet status:", tweetUpdateError);
      // Don't fail the entire operation if tweet update fails
    }

    const response = NextResponse.json({
      success: true,
      message: "Tweet successfully casted to Farcaster and payment processed",
      castHash: castData.cast?.hash,
      castUrl,
      cost: CAST_COST,
    });

    // Add CORS headers
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
