import { supabase } from "./supabase";
import { Database } from "./types/database";

type Tweet = Database["public"]["Tables"]["tweets"]["Row"];
type TweetInsert = Database["public"]["Tables"]["tweets"]["Insert"];

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
}

interface NeynarResponse {
  users: NeynarUser[];
}

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

// Note: We no longer filter out retweets - all tweets (including retweets) are saved
// The is_retweet field in the database indicates which tweets are retweets

// Fetch tweets from Twitter API (extracted from API route)
async function fetchTweetsFromTwitterAPI(fid: number): Promise<{
  user: {
    fid: number;
    username: string;
    display_name: string;
    twitter_username: string;
  };
  tweets: any;
  meta?: any;
}> {
  if (!NEYNAR_API_KEY) {
    throw new Error("Neynar API key not configured");
  }

  if (!RAPIDAPI_KEY) {
    throw new Error("RapidAPI key not configured");
  }

  // Step 1: Get user data from Neynar API
  const neynarResponse = await fetch(
    `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
    {
      method: "GET",
      headers: {
        "x-api-key": NEYNAR_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (!neynarResponse.ok) {
    const errorText = await neynarResponse.text();
    console.error("Neynar API error:", neynarResponse.status, errorText);
    throw new Error("Failed to fetch user data from Neynar");
  }

  const neynarData: NeynarResponse = await neynarResponse.json();
  const user = neynarData.users[0];

  if (!user) {
    throw new Error("User not found");
  }

  // Step 2: Extract Twitter username from verified accounts
  const twitterAccount = user.verified_accounts.find(
    (account) => account.platform === "x" || account.platform === "twitter",
  );

  if (!twitterAccount) {
    throw new Error("No verified Twitter account found for this user");
  }

  const twitterUsername = twitterAccount.username;

  // Step 3: Fetch tweets from RapidAPI
  const tweetsResponse = await fetch(
    `https://${RAPIDAPI_HOST}/user/tweets?username=${twitterUsername}&limit=10`,
    {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    },
  );

  if (!tweetsResponse.ok) {
    const errorText = await tweetsResponse.text();
    console.error("RapidAPI error:", tweetsResponse.status, errorText);
    throw new Error("Failed to fetch tweets from Twitter API");
  }

  const tweetsData = await tweetsResponse.json();

  // Step 4: Return all tweets (including retweets)
  // We save the is_retweet field to identify retweets in the database

  // Step 5: Return combined data
  return {
    user: {
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      twitter_username: twitterUsername,
    },
    tweets: tweetsData,
    meta: {
      total_tweets_fetched: tweetsData.results?.length || 0,
      retweets_included: true,
    },
  };
}

// Get cached tweets from Supabase
export async function getCachedTweets(
  fid: number,
): Promise<CachedTweetsResponse> {
  try {
    // First get user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        "id, farcaster_fid, farcaster_username, farcaster_display_name, twitter_username",
      )
      .eq("farcaster_fid", fid)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user data:", userError);
      return {
        tweets: [],
        user: null,
        lastFetched: null,
      };
    }

    // Get cached tweets for this user
    const { data: tweets, error: tweetsError } = await supabase
      .from("tweets")
      .select("*")
      .eq("user_id", userData.id)
      .eq("cast_status", "pending") // Only get tweets that haven't been processed yet
      .order("twitter_created_at", { ascending: false })
      .limit(20);

    if (tweetsError) {
      console.error("Error fetching cached tweets:", tweetsError);
      return {
        tweets: [],
        user: {
          fid: userData.farcaster_fid || fid,
          username: userData.farcaster_username || "",
          display_name: userData.farcaster_display_name || "",
          twitter_username: userData.twitter_username || "",
        },
        lastFetched: null,
      };
    }

    // Get the most recent tweet timestamp to determine last fetch time
    const lastFetched =
      tweets && tweets.length > 0 ? tweets[0].created_at : null;

    return {
      tweets: tweets || [],
      user: {
        fid: userData.farcaster_fid || fid,
        username: userData.farcaster_username || "",
        display_name: userData.farcaster_display_name || "",
        twitter_username: userData.twitter_username || "",
      },
      lastFetched,
    };
  } catch (error) {
    console.error("Error getting cached tweets:", error);
    return {
      tweets: [],
      user: null,
      lastFetched: null,
    };
  }
}

// Save new tweets to Supabase
export async function saveTweetsToDatabase(
  userId: string,
  tweets: TwitterApiTweet[],
): Promise<void> {
  try {
    const tweetsToInsert: TweetInsert[] = tweets.map((tweet) => {
      // For retweets, we want to store the retweeter's information (not the original tweet author)
      // But we also want to handle cases where we want the original author's info
      const userInfo = tweet.user;

      // Combine media URLs and video URLs into a single media_urls object
      // New structure: { images: string[], videos: Array<{url: string, bitrate: number, content_type: string}> }
      // This allows us to store both images and videos with their metadata
      const mediaUrls: Record<string, any> = {};

      if (tweet.media_url && tweet.media_url.length > 0) {
        mediaUrls.images = tweet.media_url;
      }

      if (tweet.video_url && tweet.video_url.length > 0) {
        mediaUrls.videos = tweet.video_url;
      }

      return {
        user_id: userId,
        tweet_id: tweet.tweet_id,
        content: tweet.text,
        original_content: tweet.text,
        twitter_url: `https://twitter.com/i/status/${tweet.tweet_id}`,
        twitter_created_at: tweet.creation_date || new Date().toISOString(),
        cast_status: "pending",
        is_edited: false,
        edit_count: 0,
        auto_cast: false,
        media_urls: Object.keys(mediaUrls).length > 0 ? mediaUrls : null,
        quoted_tweet_url: tweet.quoted_status_id
          ? `https://twitter.com/i/status/${tweet.quoted_status_id}`
          : null,
        is_retweet: tweet.retweet || false,
        retweet_tweet_id: tweet.retweet_tweet_id || null,
        // For retweets, store the retweeter's information (the person who retweeted)
        profile_image_url: userInfo?.profile_pic_url || null,
        twitter_username: userInfo?.username || null,
        twitter_display_name: userInfo?.name || null,
        is_blue_tick_verified:
          userInfo?.is_blue_verified || userInfo?.is_verified || false,
      };
    });

    // Check for existing tweets first to avoid duplicates
    const existingTweetIds = new Set();
    if (tweetsToInsert.length > 0) {
      const { data: existingTweets } = await supabase
        .from("tweets")
        .select("tweet_id")
        .eq("user_id", tweetsToInsert[0].user_id)
        .in("tweet_id", tweetsToInsert.map((t) => t.tweet_id).filter(Boolean));

      if (existingTweets) {
        existingTweets.forEach((tweet) => {
          if (tweet.tweet_id) existingTweetIds.add(tweet.tweet_id);
        });
      }
    }

    // Filter out tweets that already exist
    const newTweets = tweetsToInsert.filter(
      (tweet) => tweet.tweet_id && !existingTweetIds.has(tweet.tweet_id),
    );

    if (newTweets.length === 0) {
      console.log("No new tweets to save");
      return;
    }

    // Insert only new tweets
    const { error } = await supabase.from("tweets").insert(newTweets);

    if (error) {
      console.error("Error saving tweets to database:", error);
      throw error;
    }

    console.log(
      `Successfully saved ${newTweets.length} new tweets to database (${tweetsToInsert.length - newTweets.length} duplicates skipped)`,
    );
  } catch (error) {
    console.error("Error in saveTweetsToDatabase:", error);
    throw error;
  }
}

// Fetch fresh tweets from API and save to database
export async function fetchAndSaveFreshTweets(fid: number): Promise<{
  success: boolean;
  tweets: TwitterApiTweet[];
  user: any;
  error?: string;
}> {
  try {
    // Directly call the Twitter API logic instead of making HTTP request
    const data = await fetchTweetsFromTwitterAPI(fid);
    const freshTweets = data.tweets?.results || [];

    if (freshTweets.length === 0) {
      return {
        success: true,
        tweets: [],
        user: data.user,
      };
    }

    // Get or create user in database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_fid", fid)
      .single();

    if (userError || !userData) {
      // Create user if doesn't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          farcaster_fid: fid,
          farcaster_username: data.user?.username,
          farcaster_display_name: data.user?.display_name,
          twitter_username: data.user?.twitter_username,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        console.error("Error creating user:", createError);
        throw new Error("Failed to create user");
      }

      // Extract twitter user ID from the first tweet (all tweets should have the same user)
      await saveTweetsToDatabase(newUser.id, freshTweets);
    } else {
      // Extract twitter user ID from the first tweet (all tweets should have the same user)s
      await saveTweetsToDatabase(userData.id, freshTweets);
    }

    return {
      success: true,
      tweets: freshTweets,
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

// Update tweet status (e.g., when approved, rejected, or cast)
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
    const updates: any = {
      cast_status: status,
      updated_at: new Date().toISOString(),
    };

    if (additionalData) {
      if (additionalData.castHash) updates.cast_hash = additionalData.castHash;
      if (additionalData.castCreatedAt)
        updates.cast_created_at = additionalData.castCreatedAt;
      if (additionalData.castPrice)
        updates.cast_price = additionalData.castPrice;
      if (additionalData.content) updates.content = additionalData.content;
    }

    const { error } = await supabase
      .from("tweets")
      .update(updates)
      .eq("id", tweetId);

    if (error) {
      console.error("Error updating tweet status:", error);
      throw error;
    }

    console.log(`Successfully updated tweet ${tweetId} status to ${status}`);
  } catch (error) {
    console.error("Error in updateTweetStatus:", error);
    throw error;
  }
}
