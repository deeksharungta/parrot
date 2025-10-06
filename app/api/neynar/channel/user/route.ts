import { NextRequest, NextResponse } from "next/server";
import {
  withInternalAuth,
  createInternalOptionsHandler,
} from "@/lib/internal-auth-middleware";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";

// TypeScript interfaces for the response
interface ChannelUser {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pro?: {
    status: string;
    subscribed_at: string;
    expires_at: string;
  };
  pfp_url: string;
  profile: {
    bio: {
      text: string;
      mentioned_profiles: any[];
      mentioned_profiles_ranges: any[];
      mentioned_channels: any[];
      mentioned_channels_ranges: any[];
    };
    location: {
      latitude: number;
      longitude: number;
      address: {
        city?: any;
        state?: any;
        state_code?: any;
        country?: any;
        country_code?: any;
      };
      radius: number;
    };
    banner: {
      url: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  auth_addresses: Array<{
    address: string;
    app: {
      object: any;
      fid: any;
      username: any;
      display_name: any;
      pfp_url: any;
      custody_address: any;
      score: any;
    };
  }>;
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
    primary: {
      eth_address: string;
      sol_address: string;
    };
  };
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
  power_badge: boolean;
  experimental?: {
    deprecation_notice: string;
    neynar_user_score: number;
  };
  viewer_context: {
    following: boolean;
    followed_by: boolean;
    blocking: boolean;
    blocked_by: boolean;
  };
  score: number;
}

interface Channel {
  id: string;
  url: string;
  name: string;
  description: string;
  object: string;
  created_at: string;
  follower_count: number;
  external_link?: {
    title: string;
    url: string;
  };
  image_url: string;
  parent_url: string;
  lead: ChannelUser;
  moderator_fids: number[];
  member_count: number;
  moderator: ChannelUser;
  pinned_cast_hash: string;
  hosts: ChannelUser[];
  viewer_context: {
    following: boolean;
    role: string;
  };
  description_mentioned_profiles: Array<{
    object: any;
    fid: any;
    username: any;
    display_name: any;
    pfp_url: any;
    custody_address: any;
    score: any;
  }>;
  description_mentioned_profiles_ranges: Array<{
    start: number;
    end: number;
  }>;
}

interface ChannelUserResponse {
  channels: Channel[];
  next?: {
    cursor: string;
  };
}

export const OPTIONS = createInternalOptionsHandler();

export const GET = withInternalAuth(async function (request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    // Build query parameters
    const queryParams = new URLSearchParams({ fid });
    if (limit) queryParams.append("limit", limit);
    if (cursor) queryParams.append("cursor", cursor);

    // Call Neynar API to get user channels
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/channel/user/?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Neynar API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch user channels from Neynar" },
        { status: response.status },
      );
    }

    const channelData: ChannelUserResponse = await response.json();

    return NextResponse.json(channelData);
  } catch (error) {
    console.error("Error fetching user channels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
