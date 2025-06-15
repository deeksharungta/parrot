"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useSignIn } from "./useSignIn";
import { useGetTwitterAccount } from "./useGetTwitterAccount";
import { useEffect, useState } from "react";
import { secureStorage } from "@/lib/secure-storage";

export interface AuthStatus {
  isAuthenticated: boolean;
  hasTwitterAccount: boolean;
  isLoading: boolean;
  isReady: boolean;
  user: any;
  twitterAccount: any;
  error: string | null;
}

export const useAuth = (): AuthStatus => {
  const { context } = useMiniKit();
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const {
    isSignedIn,
    isLoading: isAuthLoading,
    error: authError,
  } = useSignIn();
  const {
    twitterAccount,
    isLoading: isTwitterLoading,
    error: twitterError,
  } = useGetTwitterAccount(context?.user?.fid);

  // Additional token validation to ensure authentication state is accurate
  useEffect(() => {
    const validateToken = async () => {
      const token = secureStorage.getToken();
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        setTokenValid(response.ok);
      } catch (error) {
        console.error("Token validation failed:", error);
        setTokenValid(false);
      }
    };

    // Only validate if sign-in process claims to be complete
    if (isSignedIn && !isAuthLoading) {
      validateToken();
    }
  }, [isSignedIn, isAuthLoading]);

  const isLoading = isAuthLoading || isTwitterLoading || (isSignedIn && tokenValid === null);
  const isAuthenticated = isSignedIn && tokenValid !== false;
  const hasTwitterAccount = !!twitterAccount?.username;
  const isReady = !isLoading && isAuthenticated && hasTwitterAccount;
  const error = authError || (twitterError?.message ?? null);

  return {
    isAuthenticated,
    hasTwitterAccount,
    isLoading,
    isReady,
    user: context?.user,
    twitterAccount,
    error,
  };
};

export default useAuth;
