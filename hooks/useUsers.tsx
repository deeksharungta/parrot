import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { Database } from "@/lib/types/database";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

// Type definitions
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

// API Response types
interface GetUserResponse {
  user: User | null;
  exists: boolean;
}

interface CreateUserResponse {
  user: User;
  created: boolean;
}

interface UpdateUserResponse {
  user: User;
  updated: boolean;
}

interface UpsertUserResponse {
  user: User;
  updated: boolean;
  created: boolean;
}

// API Error type
interface ApiError {
  error: string;
  user_id?: string;
}

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  byFid: (fid: number) => [...userKeys.all, "fid", fid] as const,
} as const;

// GET - Fetch user by Farcaster FID
export const useGetUser = (fid: number | undefined) => {
  const { get } = useAuthenticatedApi();

  return useQuery({
    queryKey: userKeys.byFid(fid!),
    queryFn: async (): Promise<GetUserResponse> => {
      if (!fid) {
        throw new Error("FID is required");
      }

      const response = await get(`/api/users?fid=${fid}`);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to fetch user" }));
        throw new Error(errorData.error || "Failed to fetch user");
      }

      return response.json();
    },
    enabled: !!fid, // Only run query if fid exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};

// POST - Create new user
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const { post } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (userData: UserInsert): Promise<CreateUserResponse> => {
      if (!userData.farcaster_fid) {
        throw new Error("Farcaster FID is required");
      }

      const response = await post("/api/users", userData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to create user" }));
        throw new Error(errorData.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      // Update the specific user query cache if farcaster_fid exists
      if (data.user.farcaster_fid) {
        queryClient.setQueryData(userKeys.byFid(data.user.farcaster_fid), {
          user: data.user,
          exists: true,
        });
      }
    },
  });
};

// PUT - Update existing user
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { put } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (
      userData: UserUpdate & { farcaster_fid: number },
    ): Promise<UpdateUserResponse> => {
      if (!userData.farcaster_fid) {
        throw new Error("Farcaster FID is required");
      }

      const response = await put("/api/users", userData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to update user" }));
        throw new Error(errorData.error || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      // Update the specific user query cache
      queryClient.setQueryData(userKeys.byFid(variables.farcaster_fid), {
        user: data.user,
        exists: true,
      });

      // If Neynar connection changed, invalidate twitter account query for settings page
      if ("neynar_signer_uuid" in variables) {
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", variables.farcaster_fid],
        });
      }
    },
  });
};

// PATCH - Upsert user (create or update)
export const useUpsertUser = () => {
  const queryClient = useQueryClient();
  const { patch } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (
      userData: UserInsert & { farcaster_fid: number },
    ): Promise<UpsertUserResponse> => {
      if (!userData.farcaster_fid) {
        throw new Error("Farcaster FID is required");
      }

      const response = await patch("/api/users", userData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to upsert user" }));
        throw new Error(errorData.error || "Failed to upsert user");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });

      // Update the specific user query cache
      queryClient.setQueryData(userKeys.byFid(variables.farcaster_fid), {
        user: data.user,
        exists: true,
      });

      // If Neynar connection changed, invalidate twitter account query for settings page
      if ("neynar_signer_uuid" in variables) {
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", variables.farcaster_fid],
        });
      }
    },
  });
};

// Convenience hook for getting user existence
export const useUserExists = (fid: number | undefined) => {
  const { data, ...rest } = useGetUser(fid);

  return {
    exists: data?.exists ?? false,
    user: data?.user ?? null,
    ...rest,
  };
};

// Custom hook for current user - prevents duplicate calls across components
export const useCurrentUser = () => {
  const { context } = useMiniKit();
  return useGetUser(context?.user?.fid);
};
