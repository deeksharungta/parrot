"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useSignIn } from "./useSignIn";
import { useGetTwitterAccount } from "./useGetTwitterAccount";

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

  const isLoading = isAuthLoading || isTwitterLoading;
  const isAuthenticated = isSignedIn;
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
