import React, { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useUpdateUser, useCurrentUser } from "./useUsers";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";
import sdk from "@farcaster/frame-sdk";
import { secureStorage } from "@/lib/secure-storage";

// Type definitions
export interface FarcasterUser {
  signer_uuid: string;
  public_key: string;
  status: string;
  signer_approval_url?: string;
  fid?: number;
  signer_approval_status?: "pending" | "approved" | "rejected";
}

// Query Keys
export const signerKeys = {
  all: ["signer"] as const,
  byUuid: (signer_uuid: string) =>
    [...signerKeys.all, "uuid", signer_uuid] as const,
} as const;

// CREATE - Create new signer and redirect
export const useCreateSigner = () => {
  const { context } = useMiniKit();
  const { mutate: updateUser } = useUpdateUser();
  const queryClient = useQueryClient();
  const { post } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (): Promise<string | null> => {
      const response = await post("/api/signer", {});

      if (!response.ok) {
        throw new Error("Failed to create signer");
      }

      const signerData: FarcasterUser = await response.json();

      // Set signer approval status to pending and save signer_uuid when creating new signer
      if (context?.user?.fid) {
        updateUser({
          farcaster_fid: context.user.fid,
          neynar_signer_uuid: signerData.signer_uuid,
          signer_approval_status: "pending",
        });
      }

      // Update query cache
      queryClient.setQueryData(
        signerKeys.byUuid(signerData.signer_uuid),
        signerData,
      );

      // Refresh signer approval status
      queryClient.invalidateQueries({
        queryKey: ["signerApprovalStatus", context?.user?.fid],
      });

      // Return just the approval URL
      return signerData.signer_approval_url || null;
    },
    onSuccess: (approvalUrl) => {
      console.log("Signer created successfully, approval URL:", approvalUrl);
      // Note: Removed automatic redirect - let the component handle device-specific logic
    },
    onError: (error) => {
      console.error("Failed to create signer:", error);
    },
  });
};

// Hook to get signer approval status from database
export const useSignerApprovalStatus = () => {
  const { context } = useMiniKit();
  const { data: userData, isLoading: userDataLoading } = useCurrentUser();

  return useQuery({
    queryKey: [
      "signerApprovalStatus",
      context?.user?.fid,
      userData?.user?.neynar_signer_uuid,
      userData?.user?.signer_approval_status,
    ],
    queryFn: async (): Promise<{
      signer_approval_status: string;
      signer_uuid: string | null;
    } | null> => {
      if (!context?.user?.fid) return null;

      console.log("userData", userData);

      // Return data from current user which should include signer info
      const result = {
        signer_approval_status:
          userData?.user?.signer_approval_status || "pending",
        signer_uuid: userData?.user?.neynar_signer_uuid || null,
      };

      console.log("useSignerApprovalStatus returning:", result);

      return result;
    },
    enabled: !!context?.user?.fid && !userDataLoading && !!userData,
    staleTime: 30000, // 30 seconds
  });
};

// Hook to poll for signer approval status from Neynar API
export const usePollingSignerApproval = (
  signer_uuid: string | null,
  enabled: boolean = true,
) => {
  const { context } = useMiniKit();
  const { mutate: updateUser } = useUpdateUser();
  const queryClient = useQueryClient();
  const [isApproved, setIsApproved] = React.useState(false);

  // Add debugging logs
  console.log("usePollingSignerApproval debug:", {
    signer_uuid,
    enabled,
    isApproved,
    finalEnabled: enabled && !!signer_uuid && !isApproved,
  });

  const query = useQuery({
    queryKey: ["pollingSignerApproval", signer_uuid],
    queryFn: async (): Promise<FarcasterUser | null> => {
      if (!signer_uuid) return null;

      console.log("Polling signer approval for:", signer_uuid);

      // Use authenticated fetch for polling
      const token = secureStorage.getToken();
      const response = await fetch(`/api/signer?signer_uuid=${signer_uuid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check signer status");
      }

      return response.json();
    },
    enabled: enabled && !!signer_uuid && !isApproved,
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true,
  });

  // Handle approval detection using useEffect
  const { data } = query;

  useEffect(() => {
    if (
      data &&
      data.status === "approved" &&
      context?.user?.fid &&
      !isApproved
    ) {
      setIsApproved(true);

      // Update user in database when approval is detected
      updateUser({
        farcaster_fid: context.user.fid,
        neynar_signer_uuid: data.signer_uuid,
        signer_approval_status: "approved",
      });

      // Refresh related queries
      queryClient.invalidateQueries({
        queryKey: ["users", "fid", context.user.fid],
      });

      queryClient.invalidateQueries({
        queryKey: ["signerApprovalStatus", context.user.fid],
      });
    }
  }, [data, context?.user?.fid, updateUser, queryClient, isApproved]);

  return { ...query, isApproved };
};

// UPDATE - Mark signer as approved (call this when user returns from approval)
export const useApproveSigner = () => {
  const { context } = useMiniKit();
  const { mutate: updateUser } = useUpdateUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signer_uuid: string): Promise<FarcasterUser> => {
      // Use authenticated fetch for approval check
      const token = secureStorage.getToken();
      const response = await fetch(`/api/signer?signer_uuid=${signer_uuid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check signer status");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "approved") {
        // Save to database
        if (context?.user?.fid) {
          updateUser({
            farcaster_fid: context.user.fid,
            neynar_signer_uuid: data.signer_uuid,
            signer_approval_status: "approved",
          });
        }

        // Update query cache
        queryClient.setQueryData(signerKeys.byUuid(data.signer_uuid), data);

        // Refresh user data
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", context?.user?.fid],
        });

        // Refresh signer approval status
        queryClient.invalidateQueries({
          queryKey: ["signerApprovalStatus", context?.user?.fid],
        });
      }
    },
    onError: (error) => {
      console.error("Failed to check signer status:", error);
    },
  });
};

// DELETE - Disconnect signer
export const useDisconnectSigner = () => {
  const { context } = useMiniKit();
  const { mutate: updateUser } = useUpdateUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!context?.user?.fid) {
        throw new Error("User FID not available");
      }

      // Remove from database
      updateUser({
        farcaster_fid: context.user.fid,
        neynar_signer_uuid: null,
        signer_approval_status: "pending",
      });
    },
    onSuccess: () => {
      // Clear query cache
      queryClient.removeQueries({ queryKey: signerKeys.all });
      queryClient.removeQueries({ queryKey: ["signerApprovalStatus"] });

      // Refresh user data
      queryClient.invalidateQueries({
        queryKey: ["users", "fid", context?.user?.fid],
      });
    },
    onError: (error) => {
      console.error("Failed to disconnect signer:", error);
    },
  });
};
