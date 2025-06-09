import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useUpdateUser, useCurrentUser } from "./useUsers";
import sdk from "@farcaster/frame-sdk";

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
      console.log("Signer created successfully", signerData);

      // Set signer approval status to pending when creating new signer
      if (context?.user?.fid) {
        updateUser({
          farcaster_fid: context.user.fid,
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

// Hook to get signer approval status from database
export const useSignerApprovalStatus = () => {
  const { context } = useMiniKit();
  const { data: userData } = useCurrentUser();

  return useQuery({
    queryKey: ["signerApprovalStatus", context?.user?.fid],
    queryFn: async (): Promise<{
      signer_approval_status: string;
      signer_uuid: string | null;
    } | null> => {
      if (!context?.user?.fid) return null;

      // Return data from current user which should include signer info
      return {
        signer_approval_status:
          userData?.user?.signer_approval_status || "pending",
        signer_uuid: userData?.user?.neynar_signer_uuid || null,
      };
    },
    enabled: !!context?.user?.fid,
    staleTime: 30000, // 30 seconds
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
