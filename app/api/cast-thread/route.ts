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
} from "@/lib/cast-utils";
import { base } from "viem/chains";
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constants";
import { getThreadTweets } from "@/lib/tweets-service";
import { TwitterApiTweet } from "@/lib/tweets-service";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";
import { decodeHtmlEntities } from "@/lib/utils/sanitization";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const CAST_COST = 0.1; // USDC per thread

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

interface ThreadCastResult {
  success: boolean;
  totalCost: number;
  castResults: Array<{
    tweetId: string;
    position: number;
    success: boolean;
    castHash?: string;
    castUrl?: string;
    error?: string;
  }>;
  paymentHash?: string;
  error?: string;
  usedFreeCast?: boolean;
  freeCastsRemaining?: number;
}

export const OPTIONS = createOptionsHandler();

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const { conversationId, fid, threadTweets: editedThreadTweets } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    // Use the authenticated user's FID instead of the one from the request body
    const userFid = fid || authenticatedFid;

    // Authorization check: ensure the FID in the request matches the authenticated user
    if (fid && fid !== authenticatedFid) {
      return NextResponse.json(
        {
          error: "Unauthorized: You can only cast threads for your own account",
        },
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

    // Get all thread tweets
    const threadTweets = await getThreadTweets(conversationId);

    if (threadTweets.length === 0) {
      return NextResponse.json(
        { error: "No tweets found in this thread" },
        { status: 404 },
      );
    }

    // Filter only pending tweets (not already cast)
    const pendingTweets = threadTweets.filter(
      (tweet) => tweet.cast_status === "pending",
    );

    if (pendingTweets.length === 0) {
      return NextResponse.json(
        { error: "All tweets in this thread have already been cast" },
        { status: 400 },
      );
    }

    const totalCost = CAST_COST;

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

      if (!user.usdc_balance || user.usdc_balance < totalCost) {
        return NextResponse.json(
          {
            error: `Insufficient USDC balance. Need ${totalCost} USDC to cast this thread.`,
            required: totalCost,
            available: user.usdc_balance || 0,
          },
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

        const requiredAmount = parseUnits(totalCost.toString(), 6); // USDC has 6 decimals

        if (allowance < requiredAmount || balance < requiredAmount) {
          return NextResponse.json(
            {
              error:
                "Insufficient USDC allowance or balance. Please approve spending first.",
              requiredAllowance: totalCost,
              currentAllowance: Number(allowance) / 1000000, // Convert from wei to USDC
              currentBalance: Number(balance) / 1000000, // Convert from wei to USDC
            },
            { status: 403 },
          );
        }

        console.log(
          `Allowance check passed: ${allowance} >= ${requiredAmount}`,
        );
      } catch (allowanceError) {
        console.error("Failed to check onchain allowance:", allowanceError);
        return NextResponse.json(
          { error: "Failed to verify onchain allowance" },
          { status: 500 },
        );
      }
    }

    // Cast tweets sequentially to maintain thread order
    const castResults: ThreadCastResult["castResults"] = [];
    let lastCastHash: string | undefined = undefined;

    for (const tweet of pendingTweets) {
      try {
        // Check if tweet content is truncated and fetch full details if needed
        let finalTweetContent = tweet.content;
        let updatedMediaUrls = tweet.media_urls;

        if (isTweetTruncated(tweet.content)) {
          console.log(
            `Tweet ${tweet.tweet_id} appears to be truncated, fetching full details...`,
          );
          const fullTweetDetails = await fetchTweetDetails(tweet.tweet_id!);

          if (fullTweetDetails && fullTweetDetails.text) {
            finalTweetContent = fullTweetDetails.text;
            console.log(
              `Updated content for tweet ${tweet.tweet_id} with full text`,
            );

            // Also update media URLs from full details if available - using new unified format
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

            // Store media in the new unified format (matches edit API)
            if (newMediaItems.length > 0) {
              updatedMediaUrls = newMediaItems;
            }

            // Update the tweet in the database with the full content
            const { error: updateError } = await supabase
              .from("tweets")
              .update({
                content: finalTweetContent,
                media_urls: updatedMediaUrls,
                updated_at: new Date().toISOString(),
              })
              .eq("tweet_id", tweet.tweet_id);

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

        // Check if we have edited content for this tweet
        let finalTweet = updatedTweet;
        if (editedThreadTweets && Array.isArray(editedThreadTweets)) {
          const editedTweet = editedThreadTweets.find(
            (edited: any) => edited.tweetId === tweet.tweet_id,
          );

          if (editedTweet) {
            // Apply edited content and media
            finalTweet = {
              ...updatedTweet,
              content: editedTweet.content
                ? decodeHtmlEntities(editedTweet.content)
                : decodeHtmlEntities(updatedTweet.content),
              media_urls:
                editedTweet.mediaUrls && editedTweet.mediaUrls.length > 0
                  ? editedTweet.mediaUrls
                  : updatedTweet.media_urls,
            };
          }
        }

        // Parse tweet content
        const parsedCast = await parseTweetToFarcasterCast(finalTweet, true);

        // Convert Twitter mentions to Farcaster format
        const convertedContent = await convertTwitterMentionsToFarcaster(
          parsedCast.content,
          true, // isEdit is true for thread processing
          finalTweet.original_content || undefined,
        );

        // Prepare cast payload
        const castPayload: any = {
          signer_uuid: user.neynar_signer_uuid,
          text: convertedContent,
        };

        // Add embeds if available (images, quoted tweets, etc.)
        if (parsedCast.embeds && parsedCast.embeds.length > 0) {
          // Check user's embed limit based on pro subscription status
          const embedLimit = await getEmbedLimit(userFid);
          const limitedEmbeds = parsedCast.embeds.slice(0, embedLimit);
          if (parsedCast.embeds.length > embedLimit) {
            console.log(
              `Thread tweet ${tweet.tweet_id}: Limiting embeds from ${parsedCast.embeds.length} to ${embedLimit} based on user subscription status (FID: ${userFid})`,
            );
          }
          castPayload.embeds = limitedEmbeds.map((url) => ({ url }));

          // Remove last t.co link if there are media embeds
          castPayload.text = removeLastTcoLinkIfMedia(castPayload.text, true);
        }

        // If this is not the first tweet in the thread, reply to the previous cast
        if (
          lastCastHash &&
          tweet.thread_position &&
          tweet.thread_position > 1
        ) {
          castPayload.parent = lastCastHash;
        }

        // Resolve any t.co URLs in the content before casting
        castPayload.text = await resolveTcoUrls(castPayload.text);

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

          if (hasVideo || hasGif) {
            castPayload.embeds = [tweet.twitter_url || ""];
            castPayload.text = "";
          }
        }

        // Cast to Farcaster using Neynar API
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
          console.error(
            `Neynar cast error for tweet ${tweet.tweet_id}:`,
            castResponse.status,
            errorText,
          );

          castResults.push({
            tweetId: tweet.tweet_id!,
            position: tweet.thread_position || 0,
            success: false,
            error: `Failed to cast: ${errorText}`,
          });

          // Stop casting remaining tweets in thread on failure
          break;
        }

        const castData = await castResponse.json();
        const castHash = castData.cast?.hash;
        const castUrl = `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castHash?.slice(0, 10) || "cast"}`;

        // Update tweet in database (no payment info yet)
        await supabase
          .from("tweets")
          .update({
            cast_status: "cast",
            cast_hash: castHash,
            cast_created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", tweet.id);

        castResults.push({
          tweetId: tweet.tweet_id!,
          position: tweet.thread_position || 0,
          success: true,
          castHash,
          castUrl,
        });

        // Set this cast as parent for next tweet
        lastCastHash = castHash;

        // Add small delay between casts to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error casting tweet ${tweet.tweet_id}:`, error);
        castResults.push({
          tweetId: tweet.tweet_id!,
          position: tweet.thread_position || 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        // Stop on error
        break;
      }
    }

    // Check if entire thread was successfully cast
    const successfulCasts = castResults.filter((result) => result.success);
    const isFullThreadSuccess = successfulCasts.length === pendingTweets.length;

    // Only charge if entire thread was successfully cast AND user doesn't have free casts
    const actualCost = isFullThreadSuccess ? (hasFreeCasts ? 0 : CAST_COST) : 0;

    // Process payment or deduct free cast - only if entire thread was successfully cast
    let newBalance = user.usdc_balance || 0;
    let newTotalSpent = user.total_spent || 0;
    let newFreeCastsLeft = user.free_casts_left || 0;
    let transactionHash: string | null = null;

    if (isFullThreadSuccess) {
      if (hasFreeCasts) {
        // Deduct from free casts
        newFreeCastsLeft = newFreeCastsLeft - 1;
        console.log(
          `Using free cast for thread. Free casts remaining: ${newFreeCastsLeft}`,
        );
      } else if (actualCost > 0) {
        // Process USDC payment
        newBalance = newBalance - actualCost;
        newTotalSpent = newTotalSpent + actualCost;

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
          const amountInUnits = parseUnits(actualCost.toString(), 6);

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
            {
              error: "Thread cast successfully but payment failed",
              castResults,
              totalCost: actualCost,
            },
            { status: 500 },
          );
        }
      }
    }

    // Update user balance, total spent, and free casts (only if thread was successful)
    if (isFullThreadSuccess) {
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

      // Update all successfully cast tweets with payment info
      for (const successfulCast of successfulCasts) {
        const tweet = pendingTweets.find(
          (t) => t.tweet_id === successfulCast.tweetId,
        );
        if (tweet) {
          await supabase
            .from("tweets")
            .update({
              cast_price: hasFreeCasts ? 0 : CAST_COST,
              payment_approved: true,
              payment_processed: !hasFreeCasts, // Only mark as processed if payment was actually made
              updated_at: new Date().toISOString(),
            })
            .eq("id", tweet.id);
        }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          transaction_type: hasFreeCasts ? "free_cast" : "cast_payment",
          amount: actualCost,
          currency: hasFreeCasts ? null : "USDC",
          status: "completed",
          transaction_hash: transactionHash,
          description: hasFreeCasts
            ? `Free cast of complete thread (${successfulCasts.length} tweets)`
            : `Payment for casting complete thread (${successfulCasts.length} tweets)`,
          metadata: {
            conversation_id: conversationId,
            thread_tweets: successfulCasts.length,
            total_cost: actualCost,
            cast_results: castResults,
            payment_transaction_hash: transactionHash,
            is_free_cast: hasFreeCasts,
          },
        });

      if (transactionError) {
        console.error("Failed to create transaction record:", transactionError);
        // Don't fail the entire operation if transaction logging fails
      }
    }

    const result: ThreadCastResult = {
      success: successfulCasts.length > 0,
      totalCost: actualCost,
      castResults,
      paymentHash: transactionHash || undefined,
      usedFreeCast: hasFreeCasts && isFullThreadSuccess,
      freeCastsRemaining:
        hasFreeCasts && isFullThreadSuccess
          ? newFreeCastsLeft
          : user.free_casts_left,
    };

    if (successfulCasts.length === 0) {
      result.error = "No tweets were successfully cast";
    } else if (successfulCasts.length < pendingTweets.length) {
      result.error = `Only ${successfulCasts.length} of ${pendingTweets.length} tweets were cast successfully. No payment charged for incomplete thread.`;
    }

    const response = NextResponse.json(result);

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
    console.error("Error casting thread:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
