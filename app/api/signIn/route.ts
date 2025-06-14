import neynarClient from "@/lib/neynarClient";
import { NextRequest, NextResponse } from "next/server";
import { verifyMessage } from "viem";
import * as jose from "jose";
import { supabase } from "@/lib/supabase";

export const POST = async (req: NextRequest) => {
  const { fid, signature, message, referrerFid } = await req.json();

  // Check if user exists in database
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("farcaster_fid", fid)
    .single();

  let user = existingUser;

  // Declare isValidSignature variable
  let isValidSignature: boolean;

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

    // Verify signature matches custody address (get from neynarUser since we don't store it)
    isValidSignature = await verifyMessage({
      address: neynarUser.custody_address as `0x${string}`,
      message,
      signature,
    });
  } else {
    // For existing users, we need to get custody address from Neynar for verification
    const { users } = await neynarClient.fetchBulkUsers([fid]);
    const neynarUser = users[0];

    if (!neynarUser) {
      return NextResponse.json(
        { error: "User not found in Neynar" },
        { status: 404 },
      );
    }

    // Verify signature matches custody address
    isValidSignature = await verifyMessage({
      address: neynarUser.custody_address as `0x${string}`,
      message,
      signature,
    });
  }

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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

  // Update user in database
  await supabase
    .from("users")
    .update({
      jwt_token: jwtToken,
    })
    .eq("farcaster_fid", fid);

  const response = NextResponse.json({
    success: true,
    token: jwtToken,
    user: user,
  });

  return response;
};
