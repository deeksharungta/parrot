import { useCallback } from "react";
import { secureStorage } from "@/lib/secure-storage";

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean; // Option to skip authentication for specific requests
}

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(
    async (url: string, options: AuthenticatedFetchOptions = {}) => {
      const { skipAuth = false, headers = {}, ...restOptions } = options;

      // Get token from secure storage with retry logic
      let token = secureStorage.getToken();

      // If no token found, try again after a short delay (handles race conditions)
      if (!token && !skipAuth) {
        console.log("Token not found on first attempt, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        token = secureStorage.getToken();

        if (!token) {
          console.log("No token available after retry");
          // Don't proceed with unauthenticated request for protected endpoints
          if (url.includes("/api/users") || url.includes("/api/cast")) {
            throw new Error("Authentication required but no token available");
          }
        }
      }

      // Prepare headers (removed client-side API secret)
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...(headers as Record<string, string>),
      };

      // Add JWT token if available and not skipping auth
      if (token && !skipAuth) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }

      // Make the request
      const response = await fetch(url, {
        ...restOptions,
        headers: requestHeaders,
      });

      // Handle 401 errors (token expired/invalid)
      if (response.status === 401 && !skipAuth) {
        console.log("JWT token invalid, removing from secure storage");
        secureStorage.removeToken();

        // Dispatch auth error event for global handling
        if (typeof window !== "undefined") {
          const event = new CustomEvent("auth-error", {
            detail: { message: "Authentication failed", status: 401 },
          });
          window.dispatchEvent(event);
        }
      }

      return response;
    },
    [],
  );

  return { authenticatedFetch };
};

// Convenience hooks for common HTTP methods
export const useAuthenticatedApi = () => {
  const { authenticatedFetch } = useAuthenticatedFetch();

  const get = useCallback(
    (url: string, options?: AuthenticatedFetchOptions) =>
      authenticatedFetch(url, { ...options, method: "GET" }),
    [authenticatedFetch],
  );

  const post = useCallback(
    (url: string, data?: any, options?: AuthenticatedFetchOptions) =>
      authenticatedFetch(url, {
        ...options,
        method: "POST",
        body: data ? JSON.stringify(data) : undefined,
      }),
    [authenticatedFetch],
  );

  const put = useCallback(
    (url: string, data?: any, options?: AuthenticatedFetchOptions) =>
      authenticatedFetch(url, {
        ...options,
        method: "PUT",
        body: data ? JSON.stringify(data) : undefined,
      }),
    [authenticatedFetch],
  );

  const patch = useCallback(
    (url: string, data?: any, options?: AuthenticatedFetchOptions) =>
      authenticatedFetch(url, {
        ...options,
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      }),
    [authenticatedFetch],
  );

  const del = useCallback(
    (url: string, options?: AuthenticatedFetchOptions) =>
      authenticatedFetch(url, { ...options, method: "DELETE" }),
    [authenticatedFetch],
  );

  return {
    authenticatedFetch,
    get,
    post,
    put,
    patch,
    delete: del,
  };
};
