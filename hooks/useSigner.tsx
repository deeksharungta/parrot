import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useUpdateUser } from "./useUsers";

import {
  getFarcasterSignerFromCookie,
  setFarcasterSignerCookie,
  deleteFarcasterSignerCookie,
} from "@/lib/utils/cookies";
import sdk from "@farcaster/frame-sdk";

// Type definitions
export interface FarcasterUser {
  signer_uuid: string;
  public_key: string;
  status: string;
  signer_approval_url?: string;
  fid?: number;
}

// Query Keys
export const signerKeys = {
  all: ["signer"] as const,
  byUuid: (signer_uuid: string) =>
    [...signerKeys.all, "uuid", signer_uuid] as const,
} as const;

// CREATE - Create new signer and redirect
export const useCreateSigner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<FarcasterUser> => {
      const response = await fetch("/api/signer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create signer");
      }

      return response.json();
    },
    onSuccess: (signerData) => {
      // Store in cookies
      setFarcasterSignerCookie(signerData);

      // Update query cache
      queryClient.setQueryData(
        signerKeys.byUuid(signerData.signer_uuid),
        signerData,
      );

      // Redirect to approval URL
      if (signerData.signer_approval_url) {
        sdk.actions.openUrl(signerData.signer_approval_url);
      }
    },
    onError: (error) => {
      console.error("Failed to create signer:", error);
    },
  });
};

// Hook to get stored signer from cookies
export const useStoredSigner = () => {
  return useQuery({
    queryKey: ["storedSigner"],
    queryFn: (): FarcasterUser | null => {
      // Get signer data from cookies
      const cookieData = getFarcasterSignerFromCookie();
      if (cookieData) {
        try {
          return cookieData;
        } catch (error) {
          console.error("Error parsing stored Farcaster user:", error);
          deleteFarcasterSignerCookie();
          return null;
        }
      }

      return null;
    },
    staleTime: Infinity, // This data doesn't change often
    gcTime: Infinity, // Keep in cache indefinitely
  });
};

// UPDATE - Mark signer as approved (call this when user returns from approval)
export const useApproveSigner = () => {
  const { context } = useMiniKit();
  const { mutate: updateUser } = useUpdateUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signer_uuid: string): Promise<FarcasterUser> => {
      const response = await fetch(`/api/signer?signer_uuid=${signer_uuid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check signer status");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === "approved") {
        // Store in cookies
        setFarcasterSignerCookie(data);

        // Save to database
        if (context?.user?.fid) {
          updateUser({
            farcaster_fid: context.user.fid,
            neynar_signer_uuid: data.signer_uuid,
          });
        }

        // Update query cache
        queryClient.setQueryData(signerKeys.byUuid(data.signer_uuid), data);

        // Refresh user data
        queryClient.invalidateQueries({
          queryKey: ["users", "fid", context?.user?.fid],
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
      });
    },
    onSuccess: () => {
      // Remove from cookies
      deleteFarcasterSignerCookie();

      // Clear query cache
      queryClient.removeQueries({ queryKey: signerKeys.all });
      queryClient.removeQueries({ queryKey: ["storedSigner"] });

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
