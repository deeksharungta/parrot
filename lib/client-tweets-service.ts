import { Database } from "./types/database";

type Tweet = Database["public"]["Tables"]["tweets"]["Row"];

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

export interface CachedTweetsResponse {
  tweets: Tweet[];
  user: {
    fid: number;
    username: string;
    display_name: string;
    twitter_username: string;
  } | null;
  lastFetched: string | null;
}

// Get cached tweets via server-side API
export async function getCachedTweets(
  fid: number,
): Promise<CachedTweetsResponse> {
  try {
    // Always use server-side API call
    const response = await fetch(`/api/tweets/cached-tweets?fid=${fid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to fetch cached tweets from server",
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting cached tweets:", error);
    return {
      tweets: [],
      user: null,
      lastFetched: null,
    };
  }
}

// Fetch fresh tweets from API and save to database via server-side API
export async function fetchAndSaveFreshTweets(fid: number): Promise<{
  success: boolean;
  tweets: TwitterApiTweet[];
  user: any;
  error?: string;
}> {
  try {
    // Call the server-side API endpoint that handles database operations
    const response = await fetch(`/api/tweets/cached?fid=${fid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to fetch and save fresh tweets",
      );
    }

    const data = await response.json();

    return {
      success: true,
      tweets: data.tweets || [],
      user: data.user,
    };
  } catch (error) {
    console.error("Error fetching and saving fresh tweets:", error);
    return {
      success: false,
      tweets: [],
      user: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update tweet status via server-side API
export async function updateTweetStatus(
  tweetId: string,
  status: "approved" | "rejected" | "cast" | "failed",
  additionalData?: {
    castHash?: string;
    castCreatedAt?: string;
    castPrice?: number;
    content?: string;
  },
): Promise<void> {
  try {
    // Always use server-side API call
    const response = await fetch(`/api/tweets/update-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tweetId,
        status,
        additionalData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to update tweet status via server",
      );
    }

    console.log(`Successfully updated tweet ${tweetId} status to ${status}`);
  } catch (error) {
    console.error("Error in updateTweetStatus:", error);
    throw error;
  }
}

// Cast an entire thread to Farcaster
export async function castThread(
  conversationId: string,
  fid: number,
): Promise<{
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
}> {
  try {
    const response = await fetch("/api/cast-thread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
      },
      body: JSON.stringify({
        conversationId,
        fid,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to cast thread");
    }

    return data;
  } catch (error) {
    console.error("Error casting thread:", error);
    throw error;
  }
}

// Get thread preview with cost calculation
export async function getThreadCastPreview(
  conversationId: string,
  userId: string,
): Promise<{
  threadTweets: Tweet[];
  pendingTweets: Tweet[];
  totalCost: number;
  canCast: boolean;
  threadInfo: {
    totalTweets: number;
    pendingCount: number;
    castCount: number;
    costPerThread: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `/api/tweets/thread-preview?conversation_id=${conversationId}&user_id=${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get thread preview");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting thread preview:", error);
    return {
      threadTweets: [],
      pendingTweets: [],
      totalCost: 0,
      canCast: false,
      threadInfo: {
        totalTweets: 0,
        pendingCount: 0,
        castCount: 0,
        costPerThread: 0.1,
      },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
