import { useQuery } from "@tanstack/react-query";

interface NeynarUserResponse {
  users: Array<{
    fid: number;
    username: string;
    display_name: string;
    verified_accounts: Array<{
      platform: string;
      username: string;
    }>;
  }>;
}

interface TwitterAccount {
  platform: string;
  username: string;
}

interface UseGetTwitterAccountResult {
  twitterAccount: TwitterAccount | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
  isSuccess: boolean;
}

export const useGetTwitterAccount = (
  fid: number | undefined,
): UseGetTwitterAccountResult => {
  const {
    data: twitterAccount,
    isLoading,
    error,
    isError,
    isSuccess,
  } = useQuery({
    queryKey: ["twitter-account", fid],
    queryFn: async (): Promise<TwitterAccount | null> => {
      if (!fid) {
        throw new Error("Unable to get user FID");
      }

      const response = await fetch(`/api/neynar/user?fid=${fid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData: NeynarUserResponse = await response.json();
      const user = userData.users[0];

      if (!user) {
        throw new Error("User not found");
      }

      const twitterAccount = user.verified_accounts.find(
        (account) => account.platform === "x" || account.platform === "twitter",
      );

      return twitterAccount || null;
    },
    enabled: !!fid, // Only run query if fid exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    twitterAccount: twitterAccount ?? null,
    isLoading,
    error: error as Error | null,
    isError,
    isSuccess,
  };
};
