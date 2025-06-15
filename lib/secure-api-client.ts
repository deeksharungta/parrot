/**
 * Secure API client that handles authentication without exposing secrets to the client
 */

import { secureStorage } from "./secure-storage";
import {
  sanitizeTweetContent,
  sanitizeSearchQuery,
} from "./utils/sanitization";

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

interface FetchOptions extends Omit<RequestInit, "headers"> {
  skipAuth?: boolean;
  headers?: Record<string, string>;
}

class SecureApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  }

  /**
   * Make authenticated API requests without exposing client-side secrets
   */
  private async makeRequest<T>(
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<ApiResponse<T>> {
    const { skipAuth = false, headers = {}, ...restOptions } = options;

    // Prepare headers without client-side API secrets
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    // Add JWT token if available and not skipping auth
    if (!skipAuth) {
      const token = secureStorage.getToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...restOptions,
        headers: requestHeaders,
      });

      const data = await response.json();

      // Handle 401 errors (token expired/invalid)
      if (response.status === 401 && !skipAuth) {
        console.log("JWT token invalid, removing from storage");
        secureStorage.removeToken();

        // Dispatch auth error event for global handling
        if (typeof window !== "undefined") {
          const event = new CustomEvent("auth-error", {
            detail: { message: "Authentication failed", status: 401 },
          });
          window.dispatchEvent(event);
        }
      }

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || "Request failed",
        status: response.status,
      };
    } catch (error) {
      console.error("API request failed:", error);
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  // User management methods
  async createUser(userData: any): Promise<ApiResponse> {
    return this.makeRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async getUser(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/users?id=${encodeURIComponent(id)}`);
  }

  async updateUser(id: string, userData: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async updateSettings(id: string, settings: any): Promise<ApiResponse> {
    return this.makeRequest(`/api/users/${encodeURIComponent(id)}/settings`, {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async updateBalance(
    id: string,
    amount: number,
    operation: "add" | "subtract",
  ): Promise<ApiResponse> {
    return this.makeRequest(`/api/users/${encodeURIComponent(id)}/balance`, {
      method: "PUT",
      body: JSON.stringify({ amount, operation }),
    });
  }

  // Tweet/Cast methods with input sanitization
  async castTweet(tweetContent: string): Promise<ApiResponse> {
    try {
      const sanitizedContent = sanitizeTweetContent(tweetContent);

      return this.makeRequest("/api/cast", {
        method: "POST",
        body: JSON.stringify({ content: sanitizedContent }),
      });
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Invalid tweet content",
        status: 400,
      };
    }
  }

  async castThread(tweets: string[]): Promise<ApiResponse> {
    try {
      const sanitizedTweets = tweets.map((tweet) =>
        sanitizeTweetContent(tweet),
      );

      return this.makeRequest("/api/cast-thread", {
        method: "POST",
        body: JSON.stringify({ tweets: sanitizedTweets }),
      });
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Invalid thread content",
        status: 400,
      };
    }
  }

  async getTweets(fid?: string): Promise<ApiResponse> {
    const params = fid ? `?fid=${encodeURIComponent(fid)}` : "";
    return this.makeRequest(`/api/tweets${params}`);
  }

  // Search methods with input sanitization
  async searchTweets(query: string): Promise<ApiResponse> {
    const sanitizedQuery = sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
      return {
        error: "Invalid search query",
        status: 400,
      };
    }

    return this.makeRequest(
      `/api/search/tweets?q=${encodeURIComponent(sanitizedQuery)}`,
    );
  }

  // Authentication methods
  async validateToken(token: string): Promise<ApiResponse> {
    return this.makeRequest("/api/auth/validate", {
      method: "POST",
      body: JSON.stringify({ token }),
      skipAuth: true, // This endpoint validates the token itself
    });
  }

  async signOut(): Promise<ApiResponse> {
    const result = await this.makeRequest("/api/auth/signout", {
      method: "POST",
    });

    // Clear token from storage regardless of API response
    secureStorage.removeToken();

    return result;
  }

  // Neynar API proxy methods (server-side API key usage)
  async getNeynarUser(fid: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/neynar/user?fid=${encodeURIComponent(fid)}`);
  }

  async getNeynarCasts(fid: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/neynar/casts?fid=${encodeURIComponent(fid)}`);
  }
}

// Export singleton instance
export const secureApiClient = new SecureApiClient();

// Backwards compatibility - gradually migrate from this
export const apiClient = {
  createUser: (userData: any) => secureApiClient.createUser(userData),
  getUser: (id: string) => secureApiClient.getUser(id),
  updateUser: (id: string, userData: any) =>
    secureApiClient.updateUser(id, userData),
  updateSettings: (id: string, settings: any) =>
    secureApiClient.updateSettings(id, settings),
  updateBalance: (id: string, amount: number, operation: "add" | "subtract") =>
    secureApiClient.updateBalance(id, amount, operation),
};
