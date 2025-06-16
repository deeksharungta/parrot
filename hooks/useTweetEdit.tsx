import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

interface EditTweetData {
  tweetId: string;
  content: string;
  mediaUrls?: string[];
  quotedTweetUrl?: string | null;
  isRetweetRemoved?: boolean;
  videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>;
}

interface EditTweetResponse {
  success: boolean;
  message: string;
  tweet: any;
}

interface ApiError {
  error: string;
}

// Hook to edit tweet content
export const useEditTweet = () => {
  const { post } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (editData: EditTweetData): Promise<EditTweetResponse> => {
      const response = await post("/api/tweets/edit", editData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to save edited content" }));
        throw new Error(errorData.error || "Failed to save edited content");
      }

      return response.json();
    },
    onSuccess: (data) => {},
    onError: (error) => {
      console.error("Error editing tweet:", error);
    },
  });
};

// Hook to cast tweet to Farcaster
export const useCastTweet = () => {
  const queryClient = useQueryClient();
  const { post } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (castData: {
      tweetId: string;
      fid?: number; // Make fid optional since it will be determined by JWT
      content: string;
      mediaUrls?: string[];
      quotedTweetUrl?: string | null;
      isRetweetRemoved?: boolean;
      videoUrls?: Array<{ url: string; bitrate: number; content_type: string }>;
      isEdit?: boolean;
    }): Promise<any> => {
      const response = await post("/api/cast", castData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to cast tweet" }));
        throw new Error(errorData.error || "Failed to cast tweet");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate tweet queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
      queryClient.invalidateQueries({ queryKey: ["userTweets"] });

      // Show success toast
      toast("Tweet Casted Successfully!");
    },
    onError: (error) => {
      toast("Error Casting Tweet");
      console.error("Error casting tweet:", error);
    },
  });
};
