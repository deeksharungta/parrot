import { MESSAGE_EXPIRATION_TIME } from "@/lib/constants";
import { sdk } from "@farcaster/frame-sdk";
import { useCallback, useState, useEffect } from "react";

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
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
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
        const storedToken = localStorage.getItem("token");

        if (storedToken) {
          console.log("Found stored token, validating...");
          const isValid = await validateToken(storedToken);

          if (isValid) {
            console.log("Token is valid, user is signed in");
            setIsSignedIn(true);
          } else {
            console.log("Token is invalid, removing from localStorage");
            localStorage.removeItem("token");
            setIsSignedIn(false);
          }
        } else {
          console.log("No stored token found");
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
        console.log("User is already signed in");
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

      console.log("Attempting sign in with params:", {
        nonce,
        notBefore: notBefore.toISOString(),
        expirationTime: expirationTime.toISOString(),
      });

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
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
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
        console.log("Attempting to save token to localStorage...");
        localStorage.setItem("token", data.token);
        console.log("Successfully saved token to localStorage");

        // Verify it was saved
        const savedToken = localStorage.getItem("token");
        console.log("Verification - token saved:", !!savedToken);
      } catch (error) {
        console.error("Failed to save token to localStorage:", error);
        console.log(
          "localStorage available:",
          typeof Storage !== "undefined" && typeof localStorage !== "undefined",
        );
      }

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
      console.log("Attempting to remove token from localStorage...");
      localStorage.removeItem("token");
      console.log("Successfully removed token from localStorage");
    } catch (error) {
      console.error("Failed to remove token from localStorage:", error);
    }
    setIsSignedIn(false);
  }, []);

  return { signIn, logout, isSignedIn, isLoading, error };
};
