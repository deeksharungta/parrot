"use client";

import { useEffect } from "react";
import { useSignIn } from "@/hooks/useSignIn";
import { toast } from "sonner";

export const AuthErrorHandler = () => {
  const { isSignedIn, signIn } = useSignIn();

  useEffect(() => {
    // Listen for authentication errors from API calls
    const handleAuthError = (
      event: CustomEvent<{ message: string; status: number }>,
    ) => {
      if (event.detail.status === 401) {
        toast("Session expired. Please sign in again.");

        // Attempt automatic re-authentication
        signIn().catch((error) => {
          console.error("Auto re-authentication failed:", error);
          toast("Please refresh the page and try again.");
        });
      }
    };

    // Add event listener for auth errors
    window.addEventListener("auth-error", handleAuthError as EventListener);

    return () => {
      window.removeEventListener(
        "auth-error",
        handleAuthError as EventListener,
      );
    };
  }, [signIn]);

  return null; // This component doesn't render anything
};

// Helper function to dispatch auth errors from API calls
export const dispatchAuthError = (message: string, status: number) => {
  const event = new CustomEvent("auth-error", {
    detail: { message, status },
  });
  window.dispatchEvent(event);
};
