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
  user?: {
    user_id?: string;
    username?: string;
    name?: string;
    profile_pic_url?: string;
    is_blue_verified?: boolean;
    is_verified?: boolean;
  };
  retweet_status?: {
    tweet_id: string;
    text: string;
    creation_date?: string;
    user?: {
      user_id?: string;
      username?: string;
      name?: string;
      profile_pic_url?: string;
      is_blue_verified?: boolean;
      is_verified?: boolean;
    };
  };
  media_url?: string[];
  video_url?: Array<{
    url: string;
    bitrate: number;
    content_type: string;
  }>;
  timestamp?: number;
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
