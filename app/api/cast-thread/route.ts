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
import { getThreadTweets } from "@/lib/tweets-service";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const CAST_COST = 0.1; // USDC per thread
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];

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
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    !origin ||
    !ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin))
  ) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const origin =
      request.headers.get("origin") || request.headers.get("referer");
    if (
      !origin ||
      !ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin))
    ) {
      return NextResponse.json(
        { error: "Unauthorized origin" },
        { status: 403 },
      );
    }

    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { conversationId, fid } = body;

    if (!conversationId || !fid) {
      return NextResponse.json(
        { error: "conversationId and fid are required" },
        { status: 400 },
      );
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Get user from database
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

    // Check user permissions and balance
    if (!user.spending_approved) {
      return NextResponse.json(
        { error: "USDC spending not approved. Please approve spending first." },
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

    // Check spending limit
    if (
      user.spending_limit &&
      (user.total_spent || 0) + totalCost > user.spending_limit
    ) {
      return NextResponse.json(
        {
          error:
            "Spending limit exceeded. Please increase your spending limit.",
          required: totalCost,
          currentSpent: user.total_spent || 0,
          limit: user.spending_limit,
        },
        { status: 403 },
      );
    }

    // Check onchain allowance
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

      const requiredAmount = parseUnits(totalCost.toString(), 6);

      if (allowance < requiredAmount || balance < requiredAmount) {
        return NextResponse.json(
          {
            error: "Insufficient USDC allowance or balance.",
            requiredAllowance: totalCost,
            currentAllowance: Number(allowance) / 1000000,
            currentBalance: Number(balance) / 1000000,
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

    // Cast tweets sequentially to maintain thread order
    const castResults: ThreadCastResult["castResults"] = [];
    let lastCastHash: string | undefined = undefined;

    for (const tweet of pendingTweets) {
      try {
        // Parse tweet content
        const parsedCast = await parseTweetToFarcasterCast(tweet);

        // Prepare cast payload
        const castPayload: any = {
          signer_uuid: user.neynar_signer_uuid,
          text: parsedCast.content,
        };

        // Add embeds if available
        if (parsedCast.embeds && parsedCast.embeds.length > 0) {
          castPayload.embeds = parsedCast.embeds.map((url) => ({ url }));
        }

        // If this is not the first tweet in the thread, reply to the previous cast
        if (
          lastCastHash &&
          tweet.thread_position &&
          tweet.thread_position > 1
        ) {
          castPayload.parent = lastCastHash;
        }

        // Cast to Farcaster
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
          console.error(`Cast failed for tweet ${tweet.tweet_id}:`, errorText);

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

    // Only charge if entire thread was successfully cast
    const actualCost = isFullThreadSuccess ? CAST_COST : 0;

    // Process payment only if entire thread was successfully cast
    let transactionHash: string | null = null;

    if (actualCost > 0) {
      try {
        const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
        if (!privateKey) {
          throw new Error("Private key not configured");
        }

        const account = privateKeyToAccount(privateKey);
        const walletClient = createWalletClient({
          account,
          chain: base,
          transport: http(),
        });

        const amountInUnits = parseUnits(actualCost.toString(), 6);

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

        // Update user balance
        const newBalance = (user.usdc_balance || 0) - actualCost;
        const newTotalSpent = (user.total_spent || 0) + actualCost;

        await supabase
          .from("users")
          .update({
            usdc_balance: newBalance,
            total_spent: newTotalSpent,
            updated_at: new Date().toISOString(),
          })
          .eq("farcaster_fid", fid);

        // Update all successfully cast tweets with payment info
        for (const successfulCast of successfulCasts) {
          const tweet = pendingTweets.find(
            (t) => t.tweet_id === successfulCast.tweetId,
          );
          if (tweet) {
            await supabase
              .from("tweets")
              .update({
                cast_price: CAST_COST,
                payment_approved: true,
                payment_processed: true,
                updated_at: new Date().toISOString(),
              })
              .eq("id", tweet.id);
          }
        }

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: user.id,
          transaction_type: "cast_payment",
          amount: actualCost,
          currency: "USDC",
          status: "completed",
          transaction_hash: transactionHash,
          description: `Payment for casting complete thread (${successfulCasts.length} tweets)`,
          metadata: {
            conversation_id: conversationId,
            thread_tweets: successfulCasts.length,
            total_cost: actualCost,
            cast_results: castResults,
          },
        });
      } catch (paymentError) {
        console.error("Payment processing error:", paymentError);
        return NextResponse.json(
          {
            error: "Thread partially cast but payment failed",
            castResults,
            totalCost: actualCost,
          },
          { status: 500 },
        );
      }
    }

    const result: ThreadCastResult = {
      success: successfulCasts.length > 0,
      totalCost: actualCost,
      castResults,
      paymentHash: transactionHash || undefined,
    };

    if (successfulCasts.length === 0) {
      result.error = "No tweets were successfully cast";
    } else if (successfulCasts.length < pendingTweets.length) {
      result.error = `Only ${successfulCasts.length} of ${pendingTweets.length} tweets were cast successfully. No payment charged for incomplete thread.`;
    }

    const response = NextResponse.json(result);
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
}
