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

// Helper function to filter out normal retweets (keeps quote tweets)
function filterOutNormalRetweets(tweetsData: any) {
  if (!tweetsData.results) {
    return tweetsData;
  }

  return {
    ...tweetsData,
    results: tweetsData.results.filter((tweet: any) => !tweet.retweet),
  };
}

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

  // Step 4: Filter out normal retweets
  const filteredTweetsData = filterOutNormalRetweets(tweetsData);

  // Step 5: Return combined data
  return {
    user: {
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      twitter_username: twitterUsername,
    },
    tweets: filteredTweetsData,
    meta: {
      total_tweets_fetched: tweetsData.results?.length || 0,
      tweets_after_filtering: filteredTweetsData.results?.length || 0,
      filtered_retweets:
        (tweetsData.results?.length || 0) -
        (filteredTweetsData.results?.length || 0),
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
  twitterUserId: string | null,
  tweets: TwitterApiTweet[],
): Promise<void> {
  try {
    const tweetsToInsert: TweetInsert[] = tweets.map((tweet) => ({
      user_id: userId,
      twitter_user_id: twitterUserId,
      tweet_id: tweet.tweet_id,
      content: tweet.text,
      original_content: tweet.text,
      twitter_created_at: tweet.created_at || new Date().toISOString(),
      cast_status: "pending",
      is_edited: false,
      edit_count: 0,
      auto_cast: false,
      media_urls: tweet.media_urls || null,
      quoted_tweet_url: tweet.quoted_status_id
        ? `https://twitter.com/i/status/${tweet.quoted_status_id}`
        : null,
    }));

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
      const twitterUserId =
        freshTweets.length > 0
          ? freshTweets[0]?.user?.id || data.user?.twitter_username
          : null;
      await saveTweetsToDatabase(newUser.id, twitterUserId, freshTweets);
    } else {
      // Extract twitter user ID from the first tweet (all tweets should have the same user)
      const twitterUserId =
        freshTweets.length > 0
          ? freshTweets[0]?.user?.id || data.user?.twitter_username
          : null;
      await saveTweetsToDatabase(userData.id, twitterUserId, freshTweets);
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
