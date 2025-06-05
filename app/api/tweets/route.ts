import { NextRequest, NextResponse } from "next/server";

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

interface Tweet {
  tweet_id: string;
  text: string;
  retweet: boolean;
  retweet_tweet_id?: string;
  quoted_status_id?: string;
  in_reply_to_status_id?: string;
  // ... other tweet properties
}

interface TwitterResponse {
  results: Tweet[];
  continuation_token?: string;
}

// Helper function to filter out normal retweets (keeps quote tweets)
function filterOutNormalRetweets(tweetsData: any) {
  if (!tweetsData.results) {
    return tweetsData;
  }

  return {
    ...tweetsData,
    results: tweetsData.results.filter((tweet: Tweet) => !tweet.retweet),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get("fid");
    const includeRetweets = searchParams.get("includeRetweets") === "true"; // Optional parameter

    if (!fid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 });
    }

    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: "Neynar API key not configured" },
        { status: 500 },
      );
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json(
        { error: "RapidAPI key not configured" },
        { status: 500 },
      );
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
      return NextResponse.json(
        { error: "Failed to fetch user data from Neynar" },
        { status: neynarResponse.status },
      );
    }

    const neynarData: NeynarResponse = await neynarResponse.json();
    const user = neynarData.users[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 2: Extract Twitter username from verified accounts
    const twitterAccount = user.verified_accounts.find(
      (account) => account.platform === "x" || account.platform === "twitter",
    );

    if (!twitterAccount) {
      return NextResponse.json(
        { error: "No verified Twitter account found for this user" },
        { status: 404 },
      );
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
      return NextResponse.json(
        { error: "Failed to fetch tweets from Twitter API" },
        { status: tweetsResponse.status },
      );
    }

    const tweetsData = await tweetsResponse.json();

    // Step 4: Filter out normal retweets (unless specifically requested)
    const filteredTweetsData = includeRetweets
      ? tweetsData
      : filterOutNormalRetweets(tweetsData);

    // Step 5: Return combined data
    return NextResponse.json({
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
        filtered_retweets: includeRetweets
          ? 0
          : (tweetsData.results?.length || 0) -
            (filteredTweetsData.results?.length || 0),
      },
    });
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
