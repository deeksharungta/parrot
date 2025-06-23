import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { sdk } from "@farcaster/frame-sdk";
import { useCallback, useState, useEffect } from "react";
import { secureStorage } from "@/lib/secure-storage";
import { analytics } from "@/lib/analytics";

export const useSignIn = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true to check token
  const [error, setError] = useState<string | null>(null);

  // Function to validate token against backend
  const validateToken = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/auth/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      return data.isValid;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }, []);

  // Check for existing token on component mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        const storedToken = secureStorage.getToken();

        if (storedToken) {
          const isValid = await validateToken(storedToken);

          if (isValid) {
            setIsSignedIn(true);
          } else {
            secureStorage.removeToken();
            setIsSignedIn(false);
          }
        } else {
          setIsSignedIn(false);
        }
      } catch (error) {
        console.error("Error checking existing auth:", error);
        setIsSignedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingAuth();
  }, [validateToken]);

  const signIn = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if user is already signed in
      if (isSignedIn) {
        setIsLoading(false);
        return;
      }

      // Wait for SDK to be ready
      if (!sdk.context) {
        throw new Error("Parrot must be used from Farcaster!");
      }

      // Ensure we have a proper context before proceeding
      const context = await sdk.context;

      if (!context?.user?.fid) {
        throw new Error(
          "No FID found. Please make sure you're logged into Warpcast.",
        );
      }

      // Add a small delay to ensure context is fully loaded
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Generate a more robust nonce (alphanumeric only, at least 8 characters)
      const timestamp = Date.now().toString();
      const randomStr = Math.random().toString(36).substring(2);
      const nonce = `${timestamp}${randomStr}`.substring(0, 32); // Ensure it's not too long
      const now = new Date();
      const notBefore = new Date(now.getTime() - 60000); // 1 minute before now
      const expirationTime = new Date(now.getTime() + MESSAGE_EXPIRATION_TIME);

      const result = await sdk.actions.signIn({
        nonce,
        notBefore: notBefore.toISOString(),
        expirationTime: expirationTime.toISOString(),
      });

      const referrerFid =
        context.location?.type === "cast_embed"
          ? context.location.cast.fid
          : null;

      const res = await fetch("/api/signIn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: result.signature,
          message: result.message,
          fid: context.user.fid,
          referrerFid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Sign in failed");
      }

      const data = await res.json();

      try {
        secureStorage.setToken(data.token);

        // Verify it was saved
        const savedToken = secureStorage.getToken();

        // Add a small delay and retry if token wasn't saved properly
        if (!savedToken) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          const retryToken = secureStorage.getToken();
          if (!retryToken) {
            throw new Error("Failed to save token to storage");
          }
        }
      } catch (error) {
        console.error("Failed to save token to secure storage:", error);
        throw new Error("Failed to save authentication token");
      }

      // Track successful sign-in
      analytics.trackSignIn("farcaster", context.user.fid.toString());
      analytics.identifyUser(context.user.fid.toString(), {
        fid: context.user.fid,
        username: context.user.username,
        display_name: context.user.displayName,
        pfp_url: context.user.pfpUrl,
        signed_in_at: new Date().toISOString(),
      });

      setIsSignedIn(true);
      return data;
    } catch (err) {
      console.error("Sign in error:", err);

      // Handle specific SDK errors
      if (err instanceof Error) {
        if (err.message.includes("SignIn.RejectedByUser")) {
          setError("Sign in was cancelled. Please try again.");
        } else if (
          err.message.includes("timeout") ||
          err.message.includes("Timeout")
        ) {
          setError("Sign in timed out. Please try again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Sign in failed");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    try {
      // Track sign out
      analytics.trackSignOut();
      secureStorage.removeToken();
    } catch (error) {
      console.error("Failed to remove token from secure storage:", error);
    }
    setIsSignedIn(false);
  }, []);

  return { signIn, logout, isSignedIn, isLoading, error };
};
