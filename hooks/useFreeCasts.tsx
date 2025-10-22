import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";
import { sanitizeErrorMessage } from "@/lib/utils/error-messages";

interface FreeCastsResponse {
  freeCastsLeft: number;
  totalFreeCastsGiven: number;
}

interface ApiError {
  error: string;
}

// Hook to get user's free casts information
export const useFreeCasts = () => {
  const { get } = useAuthenticatedApi();

  return useQuery({
    queryKey: ["free-casts"],
    queryFn: async (): Promise<FreeCastsResponse> => {
      const response = await get("/api/free-casts");

      if (!response.ok) {
        const errorData: ApiError = await response
          .json()
          .catch(() => ({ error: "Failed to fetch free casts info" }));
        throw new Error(sanitizeErrorMessage(errorData.error));
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
