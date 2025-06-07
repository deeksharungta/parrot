import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface EditTweetData {
  tweetId: string;
  content: string;
  mediaUrls?: string[];
  quotedTweetUrl?: string | null;
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (editData: EditTweetData): Promise<EditTweetResponse> => {
      const response = await fetch("/api/tweets/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to save edited content" }));
        throw new Error(errorData.error || "Failed to save edited content");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate tweet queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["tweets"] });
      queryClient.invalidateQueries({ queryKey: ["userTweets"] });

      console.log("Tweet edited successfully:", data.message);
    },
    onError: (error) => {
      console.error("Error editing tweet:", error);
    },
  });
};

// Hook to cast tweet to Farcaster
export const useCastTweet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (castData: {
      tweetId: string;
      fid: number;
      content: string;
      mediaUrls?: string[];
      quotedTweetUrl?: string | null;
    }): Promise<any> => {
      const response = await fetch("/api/cast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
        },
        body: JSON.stringify(castData),
      });

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
      toast.success("Tweet Casted Successfully!");

      console.log("Tweet cast successfully:", data.message);
    },
    onError: (error) => {
      toast.error("Error Casting Tweet");
      console.error("Error casting tweet:", error);
    },
  });
};
