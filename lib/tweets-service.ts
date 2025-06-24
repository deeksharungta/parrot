import { supabase } from "./supabase";
import { Database } from "./types/database";

type Tweet = Database["public"]["Tables"]["tweets"]["Row"];
type TweetInsert = Database["public"]["Tables"]["tweets"]["Insert"];

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = "https://api.neynar.com/v2";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

// Rate limiter for RapidAPI (5 requests per second)
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number; // in milliseconds

  constructor(maxRequests: number = 10, timeWindowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();

    // Remove requests older than the time window
    this.requests = this.requests.filter(
      (time) => now - time < this.timeWindow,
    );

    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.timeWindow - (now - oldestRequest) + 10; // Add 10ms buffer
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot(); // Recursively check again
    }

    // Record this request
    this.requests.push(now);
  }
}

// Global rate limiter instance for RapidAPI
const rapidApiRateLimiter = new RateLimiter(10, 1000);

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

  // Step 3: Fetch tweets from RapidAPI (with rate limiting)
  await rapidApiRateLimiter.waitForSlot();
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
): Promise<{
  totalSaved: number;
  missingTweetsFetched: number;
  duplicatesSkipped: number;
}> {
  try {
    // Step 1: Fetch missing parent tweets to complete threads

    const completeTweets = await fetchMissingParentTweets(tweets);

    // Step 2: Organize tweets by conversation to identify threads
    const conversationMap = new Map<string, TwitterApiTweet[]>();

    completeTweets.forEach((tweet) => {
      if (tweet.conversation_id) {
        if (!conversationMap.has(tweet.conversation_id)) {
          conversationMap.set(tweet.conversation_id, []);
        }
        conversationMap.get(tweet.conversation_id)!.push(tweet);
      }
    });

    // Step 3: Build proper thread chains using reply relationships
    conversationMap.forEach((conversationTweets, conversationId) => {
      // Create a map of tweet_id -> tweet for quick lookup
      const tweetMap = new Map<string, TwitterApiTweet>();
      conversationTweets.forEach((tweet) => {
        if (tweet.tweet_id) {
          tweetMap.set(tweet.tweet_id, tweet);
        }
      });

      // Find the root tweet (no parent or parent not in this conversation)
      const rootTweet = conversationTweets.find(
        (tweet) =>
          !tweet.in_reply_to_status_id ||
          !tweetMap.has(tweet.in_reply_to_status_id),
      );

      if (rootTweet) {
        // Build the thread chain starting from root
        const orderedTweets: TwitterApiTweet[] = [];
        const visited = new Set<string>();

        const addTweetAndChildren = (tweet: TwitterApiTweet): void => {
          if (!tweet.tweet_id || visited.has(tweet.tweet_id)) return;

          visited.add(tweet.tweet_id);
          orderedTweets.push(tweet);

          // Find all tweets that reply to this tweet
          const children = conversationTweets.filter(
            (t) => t.in_reply_to_status_id === tweet.tweet_id,
          );

          // Sort children by creation date and add them
          children.sort((a, b) => {
            const dateA = new Date(a.creation_date || 0).getTime();
            const dateB = new Date(b.creation_date || 0).getTime();
            return dateA - dateB;
          });

          children.forEach((child) => addTweetAndChildren(child));
        };

        addTweetAndChildren(rootTweet);

        // Update the conversation map with properly ordered tweets
        conversationMap.set(conversationId, orderedTweets);
      } else {
        // Fallback: sort by creation date if we can't find a clear root
        conversationTweets.sort((a, b) => {
          const dateA = new Date(a.creation_date || 0).getTime();
          const dateB = new Date(b.creation_date || 0).getTime();
          return dateA - dateB;
        });
      }
    });

    const tweetsToInsert: TweetInsert[] = completeTweets.map((tweet) => {
      // For retweets, we want to store the retweeter's information (not the original tweet author)
      // But we also want to handle cases where we want the original author's info
      const userInfo = tweet.user;
      let finalMediaUrls: Record<string, any> = {};

      // Process media URLs from original tweet data
      if (tweet.media_url && tweet.media_url.length > 0) {
        finalMediaUrls.images = tweet.media_url;
      }
      if (tweet.video_url && tweet.video_url.length > 0) {
        finalMediaUrls.videos = tweet.video_url;
      }

      // Process extended_entities for comprehensive media handling
      if (tweet.extended_entities?.media) {
        const mediaTypes: string[] = [];
        const allMediaUrls: string[] = [];

        tweet.extended_entities.media.forEach((media: any) => {
          if (media.type) {
            mediaTypes.push(media.type);
          }
          if (media.media_url_https || media.media_url) {
            allMediaUrls.push(media.media_url_https || media.media_url);
          }
        });

        // Store types for easy checking later
        if (mediaTypes.length > 0) {
          finalMediaUrls.types = mediaTypes;
        }

        // Store media URLs by type for backward compatibility
        const gifs = tweet.extended_entities.media.filter(
          (media: any) => media.type === "animated_gif",
        );
        const videos = tweet.extended_entities.media.filter(
          (media: any) => media.type === "video",
        );
        const photos = tweet.extended_entities.media.filter(
          (media: any) => media.type === "photo",
        );

        if (gifs.length > 0) {
          finalMediaUrls.gifs = gifs.map(
            (gif: any) => gif.media_url_https || gif.media_url,
          );
        }
        if (videos.length > 0 && !finalMediaUrls.videos) {
          finalMediaUrls.videos = videos.map(
            (video: any) => video.media_url_https || video.media_url,
          );
        }
        if (photos.length > 0 && !finalMediaUrls.images) {
          finalMediaUrls.images = photos.map(
            (photo: any) => photo.media_url_https || photo.media_url,
          );
        }
      }
      // Thread analysis
      let threadPosition: number | null = null;
      let threadTotalCount: number | null = null;
      let isThreadTweet = false;
      let isThreadStart = false;

      if (tweet.conversation_id) {
        const conversationTweets =
          conversationMap.get(tweet.conversation_id) || [];
        threadTotalCount = conversationTweets.length;

        if (threadTotalCount > 1) {
          isThreadTweet = true;
          // Find position in the thread (1-based index)
          threadPosition =
            conversationTweets.findIndex((t) => t.tweet_id === tweet.tweet_id) +
            1;
          // First tweet in the conversation is the thread start
          isThreadStart = threadPosition === 1;
        } else {
          // Single tweet "conversation" - not really a thread
          isThreadTweet = false;
          isThreadStart = false;
          threadPosition = null;
          threadTotalCount = null;
        }
      }

      return {
        user_id: userId,
        tweet_id: tweet.tweet_id,
        content: tweet.text, // Store original content, full details will be fetched when casting
        original_content: tweet.text, // Store original unchanged content
        twitter_url: `https://twitter.com/i/status/${tweet.tweet_id}`,
        twitter_created_at: tweet.creation_date || new Date().toISOString(),
        cast_status: "pending",
        is_edited: false,
        edit_count: 0,
        auto_cast: false,
        media_urls:
          Object.keys(finalMediaUrls).length > 0 ? finalMediaUrls : null,
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
        // Thread-related fields
        conversation_id: tweet.conversation_id || null,
        in_reply_to_tweet_id: tweet.in_reply_to_status_id || null,
        is_thread_tweet: isThreadTweet,
        thread_position: threadPosition,
        thread_total_count: threadTotalCount,
        is_thread_start: isThreadStart,
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

    const missingTweetsFetched = completeTweets.length - tweets.length;
    const duplicatesSkipped = tweetsToInsert.length - newTweets.length;

    if (newTweets.length === 0) {
      return {
        totalSaved: 0,
        missingTweetsFetched,
        duplicatesSkipped,
      };
    }

    // Insert only new tweets
    const { error } = await supabase.from("tweets").insert(newTweets);

    if (error) {
      console.error("Error saving tweets to database:", error);
      throw error;
    }

    return {
      totalSaved: newTweets.length,
      missingTweetsFetched,
      duplicatesSkipped,
    };
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
  totalTweetsProcessed?: number;
  missingTweetsFetched?: number;
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
        totalTweetsProcessed: 0,
        missingTweetsFetched: 0,
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
      const saveResult = await saveTweetsToDatabase(newUser.id, freshTweets);

      return {
        success: true,
        tweets: freshTweets,
        user: data.user,
        totalTweetsProcessed:
          saveResult.totalSaved + saveResult.duplicatesSkipped,
        missingTweetsFetched: saveResult.missingTweetsFetched,
      };
    } else {
      // Extract twitter user ID from the first tweet (all tweets should have the same user)s
      const saveResult = await saveTweetsToDatabase(userData.id, freshTweets);

      return {
        success: true,
        tweets: freshTweets,
        user: data.user,
        totalTweetsProcessed:
          saveResult.totalSaved + saveResult.duplicatesSkipped,
        missingTweetsFetched: saveResult.missingTweetsFetched,
      };
    }
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

// Get all tweets in a thread/conversation
export async function getThreadTweets(
  conversationId: string,
): Promise<Tweet[]> {
  try {
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("thread_position", { ascending: true });

    if (error) {
      console.error("Error fetching thread tweets:", error);
      return [];
    }

    return tweets || [];
  } catch (error) {
    console.error("Error in getThreadTweets:", error);
    return [];
  }
}

// Get thread information for a specific tweet
export async function getThreadInfo(tweetId: string): Promise<{
  threadTweets: Tweet[];
  currentPosition: number;
  totalCount: number;
  isPartOfThread: boolean;
}> {
  try {
    // First get the tweet to find its conversation_id
    const { data: tweet, error: tweetError } = await supabase
      .from("tweets")
      .select("*")
      .eq("tweet_id", tweetId)
      .single();

    if (tweetError || !tweet) {
      return {
        threadTweets: [],
        currentPosition: 0,
        totalCount: 0,
        isPartOfThread: false,
      };
    }

    if (!tweet.conversation_id || !tweet.is_thread_tweet) {
      return {
        threadTweets: [tweet],
        currentPosition: 1,
        totalCount: 1,
        isPartOfThread: false,
      };
    }

    // Get all tweets in the thread
    const threadTweets = await getThreadTweets(tweet.conversation_id);

    return {
      threadTweets,
      currentPosition: tweet.thread_position || 1,
      totalCount: tweet.thread_total_count || threadTweets.length,
      isPartOfThread: threadTweets.length > 1,
    };
  } catch (error) {
    console.error("Error in getThreadInfo:", error);
    return {
      threadTweets: [],
      currentPosition: 0,
      totalCount: 0,
      isPartOfThread: false,
    };
  }
}

// Get all threads for a user (grouped by conversation)
export async function getUserThreads(userId: string): Promise<{
  threads: Array<{
    conversationId: string;
    tweets: Tweet[];
    threadStart: Tweet;
    totalCount: number;
    lastUpdated: string;
  }>;
  singleTweets: Tweet[];
}> {
  try {
    const { data: allTweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("user_id", userId)
      .eq("cast_status", "pending")
      .order("twitter_created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user tweets:", error);
      return { threads: [], singleTweets: [] };
    }

    const threadMap = new Map<string, Tweet[]>();
    const singleTweets: Tweet[] = [];

    // Group tweets by conversation
    allTweets?.forEach((tweet) => {
      if (tweet.is_thread_tweet && tweet.conversation_id) {
        if (!threadMap.has(tweet.conversation_id)) {
          threadMap.set(tweet.conversation_id, []);
        }
        threadMap.get(tweet.conversation_id)!.push(tweet);
      } else {
        singleTweets.push(tweet);
      }
    });

    // Convert threads to organized format
    const threads = Array.from(threadMap.entries()).map(
      ([conversationId, tweets]) => {
        const sortedTweets = tweets.sort(
          (a, b) => (a.thread_position || 0) - (b.thread_position || 0),
        );
        const threadStart = sortedTweets[0];
        const lastUpdated = sortedTweets.reduce((latest, tweet) => {
          const tweetDate = new Date(tweet.updated_at || tweet.created_at);
          return tweetDate > latest ? tweetDate : latest;
        }, new Date(0));

        return {
          conversationId,
          tweets: sortedTweets,
          threadStart,
          totalCount: tweets.length,
          lastUpdated: lastUpdated.toISOString(),
        };
      },
    );

    // Sort threads by last updated
    threads.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );

    return { threads, singleTweets };
  } catch (error) {
    console.error("Error in getUserThreads:", error);
    return { threads: [], singleTweets: [] };
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
  } catch (error) {
    console.error("Error in updateTweetStatus:", error);
    throw error;
  }
}

// Fetch a single tweet by ID from Twitter API
async function fetchSingleTweetFromTwitterAPI(
  tweetId: string,
): Promise<TwitterApiTweet | null> {
  try {
    if (!RAPIDAPI_KEY) {
      throw new Error("RapidAPI key not configured");
    }

    await rapidApiRateLimiter.waitForSlot();
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
      console.error(`Failed to fetch tweet ${tweetId}:`, response.status);
      return null;
    }

    const tweetData = await response.json();
    return tweetData;
  } catch (error) {
    console.error(`Error fetching single tweet ${tweetId}:`, error);
    return null;
  }
}

// Recursively fetch missing parent tweets to complete a thread
async function fetchMissingParentTweets(
  tweets: TwitterApiTweet[],
): Promise<TwitterApiTweet[]> {
  const allTweets = [...tweets];
  const tweetIds = new Set(tweets.map((t) => t.tweet_id).filter(Boolean));
  const missingTweetIds = new Set<string>();

  // Find missing parent tweets
  tweets.forEach((tweet) => {
    if (
      tweet.in_reply_to_status_id &&
      !tweetIds.has(tweet.in_reply_to_status_id)
    ) {
      missingTweetIds.add(tweet.in_reply_to_status_id);
    }
  });

  // Fetch missing tweets
  const fetchPromises = Array.from(missingTweetIds).map(async (tweetId) => {
    const tweet = await fetchSingleTweetFromTwitterAPI(tweetId);
    return tweet;
  });

  const fetchedTweets = (await Promise.all(fetchPromises)).filter(
    Boolean,
  ) as TwitterApiTweet[];

  if (fetchedTweets.length === 0) {
    return allTweets;
  }

  // Add fetched tweets to our collection
  allTweets.push(...fetchedTweets);

  // Update our tweet IDs set
  fetchedTweets.forEach((tweet) => {
    if (tweet.tweet_id) {
      tweetIds.add(tweet.tweet_id);
    }
  });

  // Recursively check if we need to fetch more parent tweets
  const newMissingIds = new Set<string>();
  fetchedTweets.forEach((tweet) => {
    if (
      tweet.in_reply_to_status_id &&
      !tweetIds.has(tweet.in_reply_to_status_id)
    ) {
      newMissingIds.add(tweet.in_reply_to_status_id);
    }
  });

  // If we found more missing tweets, recursively fetch them
  if (newMissingIds.size > 0) {
    return fetchMissingParentTweets(allTweets);
  }

  return allTweets;
}
