import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedApi } from "./useAuthenticatedFetch";

export const useProStatus = () => {
  const { get } = useAuthenticatedApi();

  return useQuery({
    queryKey: ["proStatus"],
    queryFn: async (): Promise<{ isProUser: boolean }> => {
      const response = await get("/api/users/pro-status");

      if (!response.ok) {
        throw new Error("Failed to fetch pro status");
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
};
