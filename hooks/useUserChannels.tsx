import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

// Type definitions for channel user data (matching the API response)
interface ChannelUser {
  object: string;
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pro?: {
    status: string;
    subscribed_at: string;
    expires_at: string;
  };
  pfp_url: string;
  profile: {
    bio: {
      text: string;
      mentioned_profiles: any[];
      mentioned_profiles_ranges: any[];
      mentioned_channels: any[];
      mentioned_channels_ranges: any[];
    };
    location: {
      latitude: number;
      longitude: number;
      address: {
        city?: any;
        state?: any;
        state_code?: any;
        country?: any;
        country_code?: any;
      };
      radius: number;
    };
    banner: {
      url: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  auth_addresses: Array<{
    address: string;
    app: {
      object: any;
      fid: any;
      username: any;
      display_name: any;
      pfp_url: any;
      custody_address: any;
      score: any;
    };
  }>;
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
    primary: {
      eth_address: string;
      sol_address: string;
    };
  };
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
  power_badge: boolean;
  experimental?: {
    deprecation_notice: string;
    neynar_user_score: number;
  };
  viewer_context: {
    following: boolean;
    followed_by: boolean;
    blocking: boolean;
    blocked_by: boolean;
  };
  score: number;
}

interface Channel {
  id: string;
  url: string;
  name: string;
  description: string;
  object: string;
  created_at: string;
  follower_count: number;
  external_link?: {
    title: string;
    url: string;
  };
  image_url: string;
  parent_url: string;
  lead: ChannelUser;
  moderator_fids: number[];
  member_count: number;
  moderator: ChannelUser;
  pinned_cast_hash: string;
  hosts: ChannelUser[];
  viewer_context: {
    following: boolean;
    role: string;
  };
  description_mentioned_profiles: Array<{
    object: any;
    fid: any;
    username: any;
    display_name: any;
    pfp_url: any;
    custody_address: any;
    score: any;
  }>;
  description_mentioned_profiles_ranges: Array<{
    start: number;
    end: number;
  }>;
}

interface UserChannelsResponse {
  channels: Channel[];
  next?: {
    cursor: string;
  };
}

interface UseGetUserChannelsParams {
  fid: number;
  limit?: number;
  cursor?: string;
}

interface UseGetUserChannelsResult {
  channels: Channel[] | null;
  nextCursor: string | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => void;
}

// Query Keys
export const userChannelsKeys = {
  all: ["user-channels"] as const,
  byFid: (fid: number) => [...userChannelsKeys.all, "fid", fid] as const,
  byFidAndParams: (fid: number, limit?: number, cursor?: string) =>
    [...userChannelsKeys.byFid(fid), { limit, cursor }] as const,
} as const;

export const useGetUserChannels = (
  params: UseGetUserChannelsParams,
): UseGetUserChannelsResult => {
  const { get } = useAuthenticatedApi();
  const { fid, limit, cursor } = params;

  const {
    data: channelsResponse,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: userChannelsKeys.byFidAndParams(fid, limit, cursor),
    queryFn: async (): Promise<UserChannelsResponse> => {
      if (!fid) {
        throw new Error("FID is required");
      }

      // Build query parameters
      const queryParams = new URLSearchParams({ fid: fid.toString() });
      if (limit) queryParams.append("limit", limit.toString());
      if (cursor) queryParams.append("cursor", cursor);

      const response = await get(
        `/api/neynar/channel/user?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch user channels");
      }

      const data: UserChannelsResponse = await response.json();
      return data;
    },
    enabled: !!fid, // Only run query if fid exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Extract channels and next cursor from the response
  const channels = channelsResponse?.channels ?? null;
  const nextCursor = channelsResponse?.next?.cursor ?? null;

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
export const useUserChannels = (params: UseGetUserChannelsParams) => {
  const { channels, ...rest } = useGetUserChannels(params);

  return {
    channels: channels ?? [],
    ...rest,
  };
};

// Hook for paginated channels
export const useUserChannelsPaginated = (fid: number, limit: number = 25) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const {
    channels,
    nextCursor,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useGetUserChannels({ fid, limit, cursor });

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

// Export types for use in other components
export type { Channel, ChannelUser, UserChannelsResponse };
