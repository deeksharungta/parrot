import { useQuery } from "@tanstack/react-query";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  [key: string]: any; // for other tweet properties
}

interface UserTweetsResponse {
  user: {
    fid: number;
    username: string;
    display_name: string;
    twitter_username: string;
  };
  tweets: Tweet[];
}

interface UseGetUserTweetsResult {
  tweetIds: string[] | null;
  tweetsData: UserTweetsResponse | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
}

export const useGetUserTweets = (
  fid: number | undefined,
): UseGetUserTweetsResult => {
  const {
    data: tweetsResponse,
    isLoading,
    error,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["user-tweets", fid],
    queryFn: async (): Promise<UserTweetsResponse> => {
      if (!fid) {
        throw new Error("Unable to get user FID");
      }

      const response = await fetch(`/api/tweets?fid=${fid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch user tweets");
      }

      const data: UserTweetsResponse = await response.json();
      return data;
    },
    enabled: !!fid, // Only run query if fid exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Extract tweet IDs from the response
  // Handle different possible response structures from the Twitter API
  const extractTweetIds = (tweets: any): string[] | null => {
    if (!tweets) return null;

    // If tweets is an array, map over it
    if (Array.isArray(tweets)) {
      return tweets
        .map((tweet: any) => tweet.tweet_id || tweet.id || tweet.id_str)
        .filter(Boolean);
    }

    // If tweets has a 'results' or 'data' property (common Twitter API patterns)
    if (tweets.results && Array.isArray(tweets.results)) {
      return tweets.results
        .map((tweet: any) => tweet.tweet_id || tweet.id || tweet.id_str)
        .filter(Boolean);
    }

    if (tweets.data && Array.isArray(tweets.data)) {
      return tweets.data
        .map((tweet: any) => tweet.tweet_id || tweet.id || tweet.id_str)
        .filter(Boolean);
    }

    // If tweets has timeline entries
    if (tweets.timeline && Array.isArray(tweets.timeline)) {
      return tweets.timeline
        .map((tweet: any) => tweet.tweet_id || tweet.id || tweet.id_str)
        .filter(Boolean);
    }

    // Log the structure for debugging
    console.log("Unexpected tweets structure:", tweets);
    return null;
  };

  const tweetIds = extractTweetIds(tweetsResponse?.tweets);

  return {
    tweetIds,
    tweetsData: tweetsResponse ?? null,
    isLoading,
    error: error as Error | null,
    isError,
    isSuccess,
  };
};
