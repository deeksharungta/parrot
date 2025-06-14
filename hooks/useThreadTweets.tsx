import { useQuery } from "@tanstack/react-query";

interface ThreadTweet {
  tweet_id: string;
  content: string;
  media_urls: string[];
  thread_position: number;
  created_at: string;
  // Add other fields as needed
}

interface UseThreadTweetsResult {
  threadTweets: ThreadTweet[] | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
}

export const useThreadTweets = (
  conversationId: string | null,
  fid?: number,
  enabled: boolean = true,
): UseThreadTweetsResult => {
  const {
    data: threadTweets,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["thread-tweets", conversationId],
    queryFn: async (): Promise<ThreadTweet[]> => {
      if (!conversationId) {
        throw new Error("Conversation ID is required");
      }

      const response = await fetch(
        `/api/tweets/thread-preview?conversation_id=${conversationId}&user_id=${fid || "temp"}`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch thread tweets");
      }

      const data = await response.json();
      return data.threadTweets || [];
    },
    enabled: !!conversationId && enabled,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    threadTweets: threadTweets ?? null,
    isLoading,
    error: error as Error | null,
    isError,
  };
};
