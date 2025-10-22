import { useQuery } from "@tanstack/react-query";
import { sanitizeErrorMessage } from "@/lib/utils/error-messages";

// Type definitions based on the Neynar API response structure
export interface FarcasterUser {
  object: "user";
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
      mentioned_profiles: any[];
      mentioned_profiles_ranges: any[];
      mentioned_channels: any[];
      mentioned_channels_ranges: any[];
    };
    location?: {
      latitude: number;
      longitude: number;
      address: {
        city: string;
        state: string;
        state_code: string;
        country: string;
        country_code: string;
      };
      radius: number;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
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
  experimental: {
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

export interface UserSearchResponse {
  result: {
    users: FarcasterUser[];
    next: {
      cursor: string;
    };
  };
}

// Query Keys
export const userSearchKeys = {
  all: ["userSearch"] as const,
  search: (query: string) => [...userSearchKeys.all, "query", query] as const,
} as const;

// Hook for searching users
export const useUserSearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userSearchKeys.search(query),
    queryFn: async (): Promise<UserSearchResponse> => {
      if (!query.trim()) {
        return { result: { users: [], next: { cursor: "" } } };
      }

      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(query.trim())}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Failed to search users" }));
        throw new Error(
          sanitizeErrorMessage(errorData.error || "Failed to search users"),
        );
      }

      return response.json();
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};
