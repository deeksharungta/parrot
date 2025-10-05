import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

// Type definitions for channel search data
interface Channel {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  parent_url?: string;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  member_count?: number;
  public_casting?: boolean;
  lead?: {
    object: string;
    fid: number;
    username: string;
    display_name: string;
  };
  [key: string]: any; // for other channel properties
}

interface ChannelSearchResponse {
  channels: Channel[];
  next?: {
    cursor: string;
  };
  [key: string]: any; // for other response properties
}

interface UseChannelSearchParams {
  query: string;
  limit?: number;
  cursor?: string;
}

interface UseChannelSearchResult {
  channels: Channel[] | null;
  nextCursor: string | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => void;
}

// Query Keys
export const channelSearchKeys = {
  all: ["channel-search"] as const,
  byQuery: (query: string) =>
    [...channelSearchKeys.all, "query", query] as const,
  byQueryAndParams: (query: string, limit?: number, cursor?: string) =>
    [...channelSearchKeys.byQuery(query), { limit, cursor }] as const,
} as const;

export const useChannelSearch = (
  params: UseChannelSearchParams,
): UseChannelSearchResult => {
  const { get } = useAuthenticatedApi();
  const { query, limit, cursor } = params;

  const {
    data: searchResponse,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: channelSearchKeys.byQueryAndParams(query, limit, cursor),
    queryFn: async (): Promise<ChannelSearchResponse> => {
      if (!query || query.trim().length === 0) {
        throw new Error("Search query is required");
      }

      // Build query parameters
      const queryParams = new URLSearchParams({ q: query.trim() });
      if (limit) queryParams.append("limit", limit.toString());
      if (cursor) queryParams.append("cursor", cursor);

      const response = await get(
        `/api/neynar/channel/search?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to search channels");
      }

      const data: ChannelSearchResponse = await response.json();
      return data;
    },
    enabled: !!query && query.trim().length > 0, // Only run query if query exists and is not empty
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Extract channels and next cursor from the response
  const channels = searchResponse?.channels ?? null;
  const nextCursor = searchResponse?.next?.cursor ?? null;

  return {
    channels,
    nextCursor,
    isLoading,
    error: error as Error | null,
    isError,
    isSuccess,
    refetch,
  };
};

// Convenience hook for getting just the channels array
export const useChannelSearchResults = (params: UseChannelSearchParams) => {
  const { channels, ...rest } = useChannelSearch(params);

  return {
    channels: channels ?? [],
    ...rest,
  };
};

// Hook for paginated channel search
export const useChannelSearchPaginated = (
  query: string,
  limit: number = 25,
) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const {
    channels,
    nextCursor,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useChannelSearch({ query, limit, cursor });

  const loadMore = useCallback(() => {
    if (nextCursor) {
      setCursor(nextCursor);
    }
  }, [nextCursor]);

  const hasMore = !!nextCursor;

  return {
    channels: channels ?? [],
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
    loadMore,
    hasMore,
  };
};
