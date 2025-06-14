"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { castThread, getThreadCastPreview } from "@/lib/client-tweets-service";

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
    }: {
      conversationId: string;
      fid: number;
    }) => {
      return await castThread(conversationId, fid);
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ["threadPreview", variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["userTweets", variables.fid],
      });
      queryClient.invalidateQueries({
        queryKey: ["cachedTweets", variables.fid],
      });
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
