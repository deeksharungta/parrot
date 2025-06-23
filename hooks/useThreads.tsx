"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { castThread, getThreadCastPreview } from "@/lib/client-tweets-service";
import { toast } from "sonner";

export interface ThreadCastResult {
  success: boolean;
  totalCost: number;
  castResults: Array<{
    tweetId: string;
    position: number;
    success: boolean;
    castHash?: string;
    castUrl?: string;
    error?: string;
  }>;
  paymentHash?: string;
  error?: string;
}

export interface ThreadPreview {
  threadTweets: any[];
  pendingTweets: any[];
  totalCost: number;
  canCast: boolean;
  threadInfo: {
    totalTweets: number;
    pendingCount: number;
    castCount: number;
    costPerThread: number;
  };
  error?: string;
}

// Hook for getting thread preview
export function useThreadPreview(conversationId: string, userId: string) {
  return useQuery({
    queryKey: ["threadPreview", conversationId, userId],
    queryFn: () => getThreadCastPreview(conversationId, userId),
    enabled: !!conversationId && !!userId,
    staleTime: 30000, // 30 seconds
  });
}

// Hook for casting threads
export function useCastThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      fid,
      threadTweets,
    }: {
      conversationId: string;
      fid?: number; // Make fid optional since it will be determined by JWT
      threadTweets?: Array<{
        tweetId: string;
        content: string;
        mediaUrls: Array<{ url: string; type: string }>;
        videoUrls: Array<{
          url: string;
          bitrate: number;
          content_type: string;
        }>;
        isRetweetRemoved: boolean;
      }>;
    }) => {
      return await castThread(conversationId, fid, threadTweets);
    },
    onSuccess: (data, variables) => {
      // Dismiss any loading toasts and show success toast
      toast.dismiss();
      toast("Tweet Casted Successfully!");
      queryClient.invalidateQueries({
        queryKey: ["free-casts"],
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["threadPreview", variables.conversationId],
      });
      // Invalidate user tweets - use wildcard since we might not have the fid
      queryClient.invalidateQueries({
        queryKey: ["userTweets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["cachedTweets"],
      });
    },
    onError: (error) => {
      // Dismiss any loading toasts and show error toast
      toast.dismiss();
      toast("Error Casting Tweet");
      console.error("Error casting thread:", error);
    },
  });
}

// Hook for thread casting state management
export function useThreadCasting() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedThread, setSelectedThread] = useState<{
    conversationId: string;
    tweets: any[];
  } | null>(null);

  const openThreadModal = (conversationId: string, tweets: any[]) => {
    setSelectedThread({ conversationId, tweets });
    setIsModalOpen(true);
  };

  const closeThreadModal = () => {
    setIsModalOpen(false);
    setSelectedThread(null);
  };

  return {
    isModalOpen,
    selectedThread,
    openThreadModal,
    closeThreadModal,
  };
}
