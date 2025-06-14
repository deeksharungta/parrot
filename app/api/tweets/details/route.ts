import { NextRequest, NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

export interface TwitterApiTweet {
  tweet_id: string;
  text: string;
  creation_date?: string;
  retweet: boolean;
  retweet_tweet_id?: string;
  quoted_status_id?: string;
  in_reply_to_status_id?: string;
  conversation_id?: string;

  // Engagement metrics
  favorite_count?: number;
  retweet_count?: number;
  reply_count?: number;
  quote_count?: number;
  views?: number;
  video_view_count?: number;
  bookmark_count?: number;

  // Tweet metadata
  language?: string;
  timestamp?: number;
  source?: string;

  // Additional fields
  binding_values?: any;
  expanded_url?: string;
  extended_entities?: {
    media?: Array<{
      display_url?: string;
      expanded_url?: string;
      id_str?: string;
      indices?: number[];
      media_key?: string;
      media_url_https?: string;
      type?: string;
      url?: string;
      ext_media_availability?: {
        status?: string;
      };
      sizes?: {
        large?: { h: number; w: number; resize: string };
        medium?: { h: number; w: number; resize: string };
        small?: { h: number; w: number; resize: string };
        thumb?: { h: number; w: number; resize: string };
      };
      original_info?: {
        height?: number;
        width?: number;
        focus_rects?: any[];
      };
      video_info?: {
        aspect_ratio?: number[];
        duration_millis?: number;
        variants?: Array<{
          bitrate?: number;
          content_type?: string;
          url?: string;
        }>;
      };
      features?: any;
      additional_media_info?: any;
      media_results?: any;
      source_status_id_str?: string;
      source_user_id_str?: string;
    }>;
  };
  community_note?: any;

  user?: {
    creation_date?: string;
    user_id?: string;
    username?: string;
    name?: string;
    follower_count?: number;
    following_count?: number;
    favourites_count?: number;
    is_private?: boolean;
    is_verified?: boolean;
    is_blue_verified?: boolean;
    location?: string;
    profile_pic_url?: string;
    profile_banner_url?: string;
    description?: string;
    external_url?: string;
    number_of_tweets?: number;
    bot?: boolean;
    timestamp?: number;
    has_nft_avatar?: boolean;
    category?: any;
    default_profile?: boolean;
    default_profile_image?: boolean;
    listed_count?: number;
    verified_type?: string | null;
  };

  retweet_status?: TwitterApiTweet;
  quoted_status?: TwitterApiTweet;

  media_url?: string[] | null;
  video_url?: Array<{
    url: string;
    bitrate: number;
    content_type: string;
  }> | null;

  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tweetId = searchParams.get("tweet_id");

    if (!tweetId) {
      return NextResponse.json(
        { error: "Tweet ID is required" },
        { status: 400 },
      );
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json(
        { error: "RapidAPI key not configured" },
        { status: 500 },
      );
    }

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
      return NextResponse.json(
        { error: "Failed to fetch tweet details" },
        { status: response.status },
      );
    }

    const tweetDetails = await response.json();
    return NextResponse.json(tweetDetails);
  } catch (error) {
    console.error("Error in tweet details API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
