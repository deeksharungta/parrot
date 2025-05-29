import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/types/database";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    if (!farcaster_fid) {
      return NextResponse.json(
        { error: "Farcaster FID is required" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", farcaster_fid)
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
      farcaster_fid,
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
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    if (!farcaster_fid) {
      return NextResponse.json(
        { error: "Farcaster FID is required" },
        { status: 400 },
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", farcaster_fid)
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
      .eq("farcaster_fid", farcaster_fid)
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
}

// Combined endpoint to create or update user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcaster_fid, ...userData } = body;

    if (!farcaster_fid) {
      return NextResponse.json(
        { error: "Farcaster FID is required" },
        { status: 400 },
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", farcaster_fid)
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
        .eq("farcaster_fid", farcaster_fid)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { user, updated: true, created: false },
        { status: 200 },
      );
    } else {
      // Create new user
      const newUser: UserInsert = {
        farcaster_fid,
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

      return NextResponse.json(
        { user, updated: false, created: true },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error("Error in upsert operation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
