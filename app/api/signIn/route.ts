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

  if (!user) {
    // Fetch user from Neynar if not in database
    const { users } = await neynarClient.fetchBulkUsers([fid]);
    const neynarUser = users[0];

    if (!neynarUser) {
      return NextResponse.json(
        { error: "User not found in Neynar" },
        { status: 404 },
      );
    }

    user = {
      farcaster_fid: fid,
      username: neynarUser.username,
      display_name: neynarUser.display_name,
      pfp_url: neynarUser.pfp_url,
      custody_address: neynarUser.custody_address,
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

  // Verify signature matches custody address
  const isValidSignature = await verifyMessage({
    address: user.custody_address as `0x${string}`,
    message,
    signature,
  });

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

  const response = NextResponse.json({
    success: true,
    token: jwtToken,
    user: user,
  });

  return response;
};
