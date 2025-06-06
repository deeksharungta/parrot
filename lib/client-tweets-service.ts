import { Database } from "./types/database";

type Tweet = Database["public"]["Tables"]["tweets"]["Row"];

export interface TwitterApiTweet {
  tweet_id: string;
  text: string;
  created_at?: string;
  retweet: boolean;
  retweet_tweet_id?: string;
  quoted_status_id?: string;
  in_reply_to_status_id?: string;
  user?: {
    id?: string;
    username?: string;
  };
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
