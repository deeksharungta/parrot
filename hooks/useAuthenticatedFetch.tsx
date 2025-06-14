import { useCallback } from "react";

interface AuthenticatedFetchOptions extends RequestInit {
  skipAuth?: boolean; // Option to skip authentication for specific requests
}

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(
    async (url: string, options: AuthenticatedFetchOptions = {}) => {
      const { skipAuth = false, headers = {}, ...restOptions } = options;

      // Get token from localStorage
      const token = localStorage.getItem("token");

      // Prepare headers
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
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
        console.log("JWT token invalid, removing from localStorage");
        localStorage.removeItem("token");

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
