import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

interface PromotionCastData {
  fid?: number; // Optional since JWT auth will determine the user
  text: string;
  embeds?: string[];
}

interface PromotionCastResponse {
  success: boolean;
  message: string;
  castHash: string;
  castUrl: string;
  freeCastsAdded: number;
  totalFreeCastsLeft: number;
}

interface ApiError {
  error: string;
}

// Hook to create a promotional cast
export const usePromotionCast = () => {
  const queryClient = useQueryClient();
  const { post } = useAuthenticatedApi();

  return useMutation({
    mutationFn: async (
      castData: PromotionCastData,
    ): Promise<PromotionCastResponse> => {
      const response = await post("/api/promotion-cast", castData);

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to create promotional cast" }));
        throw new Error(errorData.error || "Failed to create promotional cast");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user queries to refresh free casts count
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-tweets"] });

      // Show success toast
      toast("You've been granted 20 free casts.");
    },
    onError: (error) => {
      toast.error("Error casting");
      console.error("Error creating promotional cast:", error);
    },
  });
};
