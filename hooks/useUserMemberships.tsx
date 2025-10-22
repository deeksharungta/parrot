import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";
import { sanitizeErrorMessage } from "@/lib/utils/error-messages";

// Type definitions for channel/membership data
interface Channel {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  parent_url?: string;
  created_at: string;
  updated_at: string;
  public_casting?: boolean;
  member_count?: number;
  follower_count?: number;
  [key: string]: any; // for other channel properties
}

interface Membership {
  channel: Channel;
  created_at: string;
  updated_at: string;
  [key: string]: any; // for other membership properties
}

interface UserMembershipsResponse {
  members: Membership[];
  next?: {
    cursor: string;
  };
  [key: string]: any; // for other response properties
}

interface UseGetUserMembershipsParams {
  fid: number;
  limit?: number;
  cursor?: string;
}

interface UseGetUserMembershipsResult {
  memberships: Membership[] | null;
  nextCursor: string | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => void;
}

// Query Keys
export const userMembershipsKeys = {
  all: ["user-memberships"] as const,
  byFid: (fid: number) => [...userMembershipsKeys.all, "fid", fid] as const,
  byFidAndParams: (fid: number, limit?: number, cursor?: string) =>
    [...userMembershipsKeys.byFid(fid), { limit, cursor }] as const,
} as const;

export const useGetUserMemberships = (
  params: UseGetUserMembershipsParams,
): UseGetUserMembershipsResult => {
  const { get } = useAuthenticatedApi();
  const { fid, limit, cursor } = params;

  const {
    data: membershipsResponse,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: userMembershipsKeys.byFidAndParams(fid, limit, cursor),
    queryFn: async (): Promise<UserMembershipsResponse> => {
      if (!fid) {
        throw new Error("FID is required");
      }

      // Build query parameters
      const queryParams = new URLSearchParams({ fid: fid.toString() });
      if (limit) queryParams.append("limit", limit.toString());
      if (cursor) queryParams.append("cursor", cursor);

      const response = await get(
        `/api/neynar/user/channel?${queryParams.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          sanitizeErrorMessage(
            errorData.error || "Failed to fetch user memberships",
          ),
        );
      }

      const data: UserMembershipsResponse = await response.json();
      return data;
    },
    enabled: !!fid, // Only run query if fid exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Extract memberships and next cursor from the response
  const memberships = membershipsResponse?.members ?? null;
  const nextCursor = membershipsResponse?.next?.cursor ?? null;

  return {
    memberships,
    nextCursor,
    isLoading,
    error: error as Error | null,
    isError,
    isSuccess,
    refetch,
  };
};

// Convenience hook for getting just the memberships array
export const useUserMemberships = (params: UseGetUserMembershipsParams) => {
  const { memberships, ...rest } = useGetUserMemberships(params);

  return {
    memberships: memberships ?? [],
    ...rest,
  };
};

// Hook for paginated memberships
export const useUserMembershipsPaginated = (
  fid: number,
  limit: number = 25,
) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const {
    memberships,
    nextCursor,
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
  } = useGetUserMemberships({ fid, limit, cursor });

  const loadMore = useCallback(() => {
    if (nextCursor) {
      setCursor(nextCursor);
    }
  }, [nextCursor]);

  const hasMore = !!nextCursor;

  return {
    memberships: memberships ?? [],
    isLoading,
    error,
    isError,
    isSuccess,
    refetch,
    loadMore,
    hasMore,
  };
};
