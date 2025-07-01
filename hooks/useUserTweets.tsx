import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getCachedTweets,
  fetchAndSaveFreshTweets,
  updateTweetStatus,
  type CachedTweetsResponse,
} from "@/lib/client-tweets-service";
import { Database } from "@/lib/types/database";

type Tweet = Database["public"]["Tables"]["tweets"]["Row"];

interface UseUserTweetsResult {
  tweetIds: string[] | null;
  tweets: Tweet[] | null;
  tweetsData: CachedTweetsResponse | null;
  isLoading: boolean;
  isLoadingFresh: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  hasNewTweets: boolean;
  refreshTweets: () => void;
  forceRefreshTweets: () => Promise<void>;
  updateTweetStatus: (
    tweetId: string,
    status: "approved" | "rejected" | "cast" | "failed",
  ) => Promise<void>;
  isFullyLoaded: boolean;
}

export const useUserTweets = (fid: number | undefined): UseUserTweetsResult => {
  const queryClient = useQueryClient();
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [hasNewTweets, setHasNewTweets] = useState(false);
  const [hasFetchedFreshOnce, setHasFetchedFreshOnce] = useState(false);

  // Query for cached tweets - shows immediately
  const {
    data: cachedData,
    isLoading: isLoadingCached,
    error: cachedError,
    isError: isCachedError,
    isSuccess: isCachedSuccess,
  } = useQuery({
    queryKey: ["cached-tweets", fid],
    queryFn: async (): Promise<CachedTweetsResponse> => {
      if (!fid) {
        throw new Error("Unable to get user FID");
      }
      const result = await getCachedTweets(fid);
      return result;
    },
    enabled: !!fid,
    staleTime: 1 * 60 * 1000, // Consider cached data fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes("401") || error.message.includes("token")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Background fetch for fresh tweets
  const fetchFreshTweets = async () => {
    if (!fid || isLoadingFresh) return;

    setIsLoadingFresh(true);
    try {
      const result = await fetchAndSaveFreshTweets(fid);

      if (result.success && result.tweets.length > 0) {
        // Invalidate cached tweets query to refetch from database
        await queryClient.invalidateQueries({
          queryKey: ["cached-tweets", fid],
        });
        setHasNewTweets(true);

        // Auto-hide the "new tweets" indicator after 3 seconds
        setTimeout(() => setHasNewTweets(false), 3000);
      }
      setHasFetchedFreshOnce(true);
    } catch (error) {
      console.error("Error fetching fresh tweets:", error);
      setHasFetchedFreshOnce(true);
    } finally {
      setIsLoadingFresh(false);
    }
  };

  // Determine if this is a first-time user (no cached tweets)
  const isFirstTimeUser = cachedData?.tweets.length === 0 && isCachedSuccess;

  // Fetch fresh tweets on mount and periodically
  useEffect(() => {
    if (!fid) return;

    // For first-time users, fetch immediately and show loading
    // For returning users, fetch in background
    if (isFirstTimeUser) {
      // First time user - fetch immediately
      fetchFreshTweets();
    } else {
      // Returning user - fetch in background after a short delay
      const timer = setTimeout(() => {
        fetchFreshTweets();
      }, 1000);

      // Set up periodic background refresh (every 5 minutes)
      const interval = setInterval(fetchFreshTweets, 5 * 60 * 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [fid, isFirstTimeUser]);

  // Extract tweet IDs from cached data
  const extractTweetIds = (tweets: Tweet[] | null): string[] | null => {
    if (!tweets || tweets.length === 0) return null;

    return tweets
      .map((tweet) => tweet.tweet_id)
      .filter((id): id is string => Boolean(id));
  };

  // Manual refresh function
  const refreshTweets = () => {
    // Force invalidate and refetch cached data immediately
    queryClient.invalidateQueries({ queryKey: ["cached-tweets", fid] });
    // Also fetch fresh tweets in the background
    fetchFreshTweets();
  };

  // Force refresh function for status updates
  const forceRefreshTweets = async () => {
    // Invalidate and refetch without clearing cache to prevent flicker
    await queryClient.invalidateQueries({ queryKey: ["cached-tweets", fid] });

    // Force refetch the query immediately
    await queryClient.refetchQueries({
      queryKey: ["cached-tweets", fid],
      type: "active",
    });

    // Set hasNewTweets to trigger UI update
    setHasNewTweets(true);

    // Auto-hide the indicator after 3 seconds
    setTimeout(() => setHasNewTweets(false), 3000);
  };

  // Update tweet status function
  const updateTweetStatusHandler = async (
    tweetId: string,
    status: "approved" | "rejected" | "cast" | "failed",
  ) => {
    try {
      // Find the tweet in our cached data to get the database ID
      const tweet = cachedData?.tweets.find((t) => t.tweet_id === tweetId);
      if (!tweet) {
        throw new Error("Tweet not found in cached data");
      }

      await updateTweetStatus(tweet.id, status);

      // Invalidate cache to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["cached-tweets", fid] });
    } catch (error) {
      console.error("Error updating tweet status:", error);
      throw error;
    }
  };

  const tweetIds = extractTweetIds(cachedData?.tweets || null);

  return {
    tweetIds,
    tweets: cachedData?.tweets || null,
    tweetsData: cachedData ?? null,
    isLoading: isLoadingCached,
    isLoadingFresh,
    error: cachedError as Error | null,
    isError: isCachedError,
    isSuccess: isCachedSuccess,
    hasNewTweets,
    refreshTweets,
    forceRefreshTweets,
    updateTweetStatus: updateTweetStatusHandler,
    isFullyLoaded: !isLoadingCached && hasFetchedFreshOnce,
  };
};
