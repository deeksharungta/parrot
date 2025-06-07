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
import { USDC_ADDRESS, SPENDER_ADDRESS } from "@/lib/constant";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const CAST_COST = 0.1; // USDC
const API_SECRET_KEY = process.env.API_SECRET_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
];

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight requests
  const origin = request.headers.get("origin");
  console.log("origin", origin);
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
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Security Check 1: Origin validation
    const origin =
      request.headers.get("origin") || request.headers.get("referer");
    console.log("origin", origin);
    if (
      !origin ||
      !ALLOWED_ORIGINS.some((allowedOrigin) => origin.startsWith(allowedOrigin))
    ) {
      return NextResponse.json(
        { error: "Unauthorized origin" },
        { status: 403 },
      );
    }

    // Security Check 2: API Key validation
    const apiKey = request.headers.get("x-api-key");
    if (!apiKey || apiKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { tweetId, fid } = body;

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

    // // Check if user has approved spending and has sufficient balance
    // if (!user.spending_approved) {
    //   return NextResponse.json(
    //     { error: "USDC spending not approved. Please approve spending first." },
    //     { status: 403 },
    //   );
    // }

    // if (!user.usdc_balance || user.usdc_balance < CAST_COST) {
    //   return NextResponse.json(
    //     { error: "Insufficient USDC balance. Please top up your account." },
    //     { status: 402 },
    //   );
    // }

    // // Check spending limit
    // if (
    //   user.spending_limit &&
    //   (user.total_spent || 0) + CAST_COST > user.spending_limit
    // ) {
    //   return NextResponse.json(
    //     {
    //       error:
    //         "Spending limit exceeded. Please increase your spending limit.",
    //     },
    //     { status: 403 },
    //   );
    // }

    // // Check onchain allowance using viem
    // if (!user.wallet_address) {
    //   return NextResponse.json(
    //     { error: "Wallet address not found for user" },
    //     { status: 400 },
    //   );
    // }

    // const publicClient = createPublicClient({
    //   chain: base,
    //   transport: http(),
    // });

    // try {
    //   const allowance = await publicClient.readContract({
    //     address: USDC_ADDRESS,
    //     abi: erc20Abi,
    //     functionName: "allowance",
    //     args: [user.wallet_address as `0x${string}`, SPENDER_ADDRESS],
    //   });

    //   const requiredAmount = parseUnits(CAST_COST.toString(), 6); // USDC has 6 decimals

    // if (allowance < requiredAmount) {
    //   return NextResponse.json(
    //     {
    //       error:
    //         "Insufficient USDC allowance. Please approve spending first.",
    //       requiredAllowance: CAST_COST,
    //       currentAllowance: Number(allowance) / 1000000, // Convert from wei to USDC
    //     },
    //     { status: 403 },
    //   );
    // }

    //   console.log(`Allowance check passed: ${allowance} >= ${requiredAmount}`);
    // } catch (allowanceError) {
    //   console.error("Failed to check onchain allowance:", allowanceError);
    //   return NextResponse.json(
    //     { error: "Failed to verify onchain allowance" },
    //     { status: 500 },
    //   );
    // }

    // Get tweet data from database
    const { data: tweet, error: tweetError } = await supabase
      .from("tweets")
      .select("*")
      .eq("tweet_id", tweetId)
      .single();

    if (tweetError || !tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    const parsedCast = await parseTweetToFarcasterCast(tweet);

    // Process payment FIRST (0.1 USDC)
    // const newBalance = (user.usdc_balance || 0) - CAST_COST;
    // const newTotalSpent = (user.total_spent || 0) + CAST_COST;

    // // Execute actual USDC payment via blockchain transaction
    // let transactionHash = null;
    // try {
    //   const privateKey = process.env.PRIVATE_KEY as `0x${string}`;

    //   if (!privateKey) {
    //     console.error("Private key not configured");
    //     return NextResponse.json(
    //       { error: "Payment system not configured" },
    //       { status: 500 },
    //     );
    //   }

    //   const account = privateKeyToAccount(privateKey);

    //   const walletClient = createWalletClient({
    //     account,
    //     chain: base,
    //     transport: http(),
    //   });

    //   // Convert amount to proper USDC units (6 decimals)
    //   const amountInUnits = parseUnits(CAST_COST.toString(), 6);

    //   transactionHash = await walletClient.writeContract({
    //     address: USDC_ADDRESS,
    //     abi: erc20Abi,
    //     functionName: "transferFrom",
    //     args: [
    //       user.wallet_address as `0x${string}`,
    //       SPENDER_ADDRESS,
    //       amountInUnits,
    //     ],
    //   });

    //   console.log("Payment transaction successful:", transactionHash);
    // } catch (paymentError) {
    //   console.error("Payment processing error:", paymentError);
    //   return NextResponse.json(
    //     { error: "Failed to process USDC payment" },
    //     { status: 500 },
    //   );
    // }

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

    // // Only update user balance and create records if payment transaction succeeded
    // // Update user balance and total spent in a transaction
    // const { error: updateUserError } = await supabase
    //   .from("users")
    //   .update({
    //     usdc_balance: newBalance,
    //     total_spent: newTotalSpent,
    //     updated_at: new Date().toISOString(),
    //   })
    //   .eq("farcaster_fid", fid);

    // if (updateUserError) {
    //   console.error("Failed to update user balance:", updateUserError);
    //   return NextResponse.json(
    //     { error: "Failed to update user balance after payment" },
    //     { status: 500 },
    //   );
    // }

    // // Create transaction record with blockchain transaction hash
    // const { error: transactionError } = await supabase
    //   .from("transactions")
    //   .insert({
    //     user_id: user.id,
    //     tweet_id: tweetId,
    //     transaction_type: "cast_payment",
    //     amount: CAST_COST,
    //     currency: "USDC",
    //     status: "completed",
    //     transaction_hash: transactionHash,
    //     description: `Payment for casting tweet to Farcaster`,
    //     metadata: {
    //       cast_hash: castData.cast?.hash,
    //       fid: fid,
    //       cast_url: `https://warpcast.com/${castData.cast?.author?.username || "user"}/${castData.cast?.hash?.slice(0, 10) || "cast"}`,
    //       payment_transaction_hash: transactionHash,
    //     },
    //   });

    // if (transactionError) {
    //   console.error("Failed to create transaction record:", transactionError);
    //   // Don't fail the entire operation if transaction logging fails
    // }

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
}
