import neynarClient from "@/lib/neynarClient";
import { NextRequest, NextResponse } from "next/server";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import * as jose from "jose";
import { supabase } from "@/lib/supabase";

export const POST = async (req: NextRequest) => {
  const { fid, signature, message, referrerFid } = await req.json();

  // Extract nonce and domain from the message
  // Message format: "example.com wants you to sign in with your Ethereum account:\n\n...\n\nNonce: abcd1234"
  const nonce = message.match(/Nonce: (.+)/)?.[1];
  const domain = message.match(/^([^\s]+)/)?.[1];

  if (!nonce || !domain) {
    return NextResponse.json(
      { error: "Invalid message format" },
      { status: 400 },
    );
  }

  // Create Farcaster auth client with proper viem connector
  const appClient = createAppClient({
    ethereum: viemConnector(),
  });

  // Verify the sign in message with auth address support
  const { data, success } = await appClient.verifySignInMessage({
    nonce,
    domain,
    message,
    signature,
    acceptAuthAddress: true, // Enable auth address verification
  });

  if (!success || !data) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Check if user exists in database
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("farcaster_fid", fid)
    .single();

  let user = existingUser;

  if (!user) {
    // Fetch user from Neynar if not in database
    const { users } = await neynarClient.fetchBulkUsers([fid]);
    console.log("users", users);
    const neynarUser = users[0];
    console.log("neynarUser", neynarUser);

    if (!neynarUser) {
      return NextResponse.json(
        { error: "User not found in Neynar" },
        { status: 404 },
      );
    }

    user = {
      farcaster_fid: fid,
      farcaster_username: neynarUser.username,
      farcaster_display_name: neynarUser.display_name,
    };

    // Save user to database
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user:", insertError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    user = newUser;
  }

  // Generate a session token using fid and current timestamp
  const jwtToken = await new jose.SignJWT({
    fid,
    referrerFid,
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30 days")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET));

  const response = NextResponse.json({
    success: true,
    token: jwtToken,
    user: user,
  });

  return response;
};
