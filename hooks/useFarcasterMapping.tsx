import { useQuery } from "@tanstack/react-query";

interface FarcasterMappingEntry {
  id: string;
  name: string;
  xUsername: string;
  farcasterUsername: string;
  status: string;
  date: string;
  url: string;
}

interface FarcasterMappingResponse {
  data: FarcasterMappingEntry[];
  mapping: Record<string, string>;
  total: number;
}

export function useFarcasterMapping() {
  return useQuery<FarcasterMappingResponse>({
    queryKey: ["farcaster-mapping"],
    queryFn: async () => {
      const response = await fetch("/api/notion/farcaster-usernames");
      if (!response.ok) {
        throw new Error("Failed to fetch Farcaster username mappings");
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Helper hook to get a specific Farcaster username by X username
export function useFarcasterUsernameByX(xUsername: string | null) {
  return useQuery({
    queryKey: ["farcaster-username", xUsername],
    queryFn: async () => {
      if (!xUsername) return null;

      const response = await fetch("/api/notion/farcaster-usernames", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ xUsername }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch Farcaster username");
      }

      return response.json();
    },
    enabled: !!xUsername,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

// Utility function to get Farcaster username from the mapping
export function getFarcasterUsername(
  mapping: Record<string, string> | undefined,
  xUsername: string,
): string | null {
  if (!mapping || !xUsername) return null;
  return mapping[xUsername.toLowerCase()] || null;
}
