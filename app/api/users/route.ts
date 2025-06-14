import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/types/database";
import { withAuth, createOptionsHandler } from "@/lib/auth-middleware";
import { withApiKeyAndJwtAuth } from "@/lib/jwt-auth-middleware";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export const OPTIONS = createOptionsHandler();

export const GET = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  const { searchParams } = new URL(request.url);
  const requestedFid = searchParams.get("fid");

  // If no FID is provided in query, use the authenticated user's FID
  const fid = requestedFid || authenticatedFid.toString();

  // Authorization check: users can only access their own data
  if (requestedFid && parseInt(requestedFid) !== authenticatedFid) {
    return NextResponse.json(
      { error: "Unauthorized: You can only access your own user data" },
      { status: 403 },
    );
  }

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("farcaster_fid", parseInt(fid))
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user:", error);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 },
      );
    }

    if (!user) {
      return NextResponse.json({ user: null, exists: false }, { status: 200 });
    }

    return NextResponse.json({ user, exists: true }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const POST = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    // Use authenticated FID for user creation
    const userFid = farcaster_fid || authenticatedFid;

    // Authorization check: users can only create their own user record
    if (farcaster_fid && farcaster_fid !== authenticatedFid) {
      return NextResponse.json(
        { error: "Unauthorized: You can only create your own user record" },
        { status: 403 },
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", userFid)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this FID already exists",
          user_id: existingUser.id,
        },
        { status: 409 },
      );
    }

    // Create new user
    const newUser: UserInsert = {
      farcaster_fid: userFid,
      ...userData,
    };

    const { data: user, error } = await supabase
      .from("users")
      .insert(newUser)
      .select()
      .single();

    if (error) {
      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ user, created: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const PUT = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    // Use authenticated FID for user update
    const userFid = farcaster_fid || authenticatedFid;

    // Authorization check: users can only update their own user record
    if (farcaster_fid && farcaster_fid !== authenticatedFid) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own user record" },
        { status: 403 },
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", userFid)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user
    const updateData: UserUpdate = {
      ...userData,
      updated_at: new Date().toISOString(),
    };

    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("farcaster_fid", userFid)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({ user, updated: true }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

// Combined endpoint to create or update user
export const PATCH = withApiKeyAndJwtAuth(async function (
  request: NextRequest,
  authenticatedFid: number,
) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    // Use authenticated FID for user upsert
    const userFid = farcaster_fid || authenticatedFid;

    // Authorization check: users can only upsert their own user record
    if (farcaster_fid && farcaster_fid !== authenticatedFid) {
      return NextResponse.json(
        {
          error:
            "Unauthorized: You can only create/update your own user record",
        },
        { status: 403 },
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", userFid)
      .single();

    if (existingUser) {
      // Update existing user
      const updateData: UserUpdate = {
        ...userData,
        updated_at: new Date().toISOString(),
      };

      const { data: user, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("farcaster_fid", userFid)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 },
        );
      }

      return NextResponse.json({ user, updated: true }, { status: 200 });
    } else {
      // Create new user
      const newUser: UserInsert = {
        farcaster_fid: userFid,
        ...userData,
      };

      const { data: user, error } = await supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }

      return NextResponse.json({ user, created: true }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
