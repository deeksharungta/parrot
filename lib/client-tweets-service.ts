import { Database } from "./types/database";
import { secureStorage } from "./secure-storage";

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
    // Get JWT token from secure storage for authentication
    const token = secureStorage.getToken();

    // Always use server-side API call
    const response = await fetch(`/api/tweets/cached-tweets?fid=${fid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }

      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching cached tweets:", error);
    throw error;
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
    // Get JWT token from secure storage for authentication
    const token = secureStorage.getToken();

    // Call the server-side API endpoint that handles database operations
    const response = await fetch(`/api/tweets/cached?fid=${fid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }

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
    // Get JWT token from secure storage for authentication
    const token = secureStorage.getToken();

    // Always use server-side API call
    const response = await fetch(`/api/tweets/update-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        tweetId,
        status,
        additionalData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }

      throw new Error(
        errorData.error || "Failed to update tweet status via server",
      );
    }
  } catch (error) {
    console.error("Error in updateTweetStatus:", error);
    throw error;
  }
}

// Cast an entire thread to Farcaster
export async function castThread(
  conversationId: string,
  fid?: number, // Make fid optional since it will be determined by JWT
  threadTweets?: Array<{
    tweetId: string;
    content: string;
    mediaUrls: Array<{ url: string; type: string }>;
    videoUrls: Array<{ url: string; bitrate: number; content_type: string }>;
    isRetweetRemoved: boolean;
  }>,
  channel_id?: string, // Add channel_id parameter
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
    // Get JWT token from secure storage
    const token = secureStorage.getToken();

    const response = await fetch("/api/cast-thread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        conversationId,
        ...(fid ? { fid } : {}), // Only include fid if provided
        ...(threadTweets ? { threadTweets } : {}), // Include thread tweets if provided
        ...(channel_id ? { channel_id } : {}), // Include channel_id if provided
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }
      throw new Error(data.error || "Failed to cast thread");
    }

    return data;
  } catch (error) {
    console.error("Error casting thread:", error);
    throw error;
  }
}

// Restore all rejected tweets to pending status
export async function restoreRejectedTweets(): Promise<{
  success: boolean;
  restoredCount: number;
  message: string;
  error?: string;
}> {
  try {
    // Get JWT token from secure storage for authentication
    const token = secureStorage.getToken();

    const response = await fetch("/api/tweets/restore-rejected", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }

      throw new Error(errorData.error || "Failed to restore rejected tweets");
    }

    const data = await response.json();
    return {
      success: true,
      restoredCount: data.restoredCount || 0,
      message: data.message || "Successfully restored rejected tweets",
    };
  } catch (error) {
    console.error("Error restoring rejected tweets:", error);
    return {
      success: false,
      restoredCount: 0,
      message: "Failed to restore rejected tweets",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get thread preview with cost calculation
export async function getThreadCastPreview(
  conversationId: string,
  userId?: string, // Now optional since we use authenticated user
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
    // Get JWT token from secure storage for authentication
    const token = secureStorage.getToken();

    const response = await fetch(
      `/api/tweets/thread-preview?conversation_id=${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle authentication errors
      if (response.status === 401) {
        secureStorage.removeToken();
      }

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
