/**
 * Secure storage utility for handling authentication tokens
 * Uses secure methods when available, falls back to localStorage as needed
 */

interface StorageOptions {
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number; // in seconds
}

class SecureStorage {
  private isClient = typeof window !== "undefined";

  /**
   * Store a token securely
   * Priority: HTTP-only cookie > sessionStorage > localStorage
   */
  setToken(token: string, options: StorageOptions = {}): void {
    if (!this.isClient) return;

    const {
      secure = process.env.NODE_ENV === "production",
      sameSite = "lax",
      maxAge = 60 * 60 * 24 * 7, // 7 days default
    } = options;

    try {
      // Try to set as secure HTTP-only cookie via API call
      this.setSecureCookie(token, { secure, sameSite, maxAge });

      // Also store in sessionStorage for immediate access
      // (This will be cleared when tab closes, providing additional security)
      sessionStorage.setItem("session_token", token);

      // Set a flag in localStorage to indicate we have a token
      localStorage.setItem("has_auth", "true");
    } catch (error) {
      console.warn(
        "Secure storage failed, falling back to localStorage:",
        error,
      );

      // Fallback to localStorage with additional metadata
      const tokenData = {
        token,
        timestamp: Date.now(),
        secure: secure,
        maxAge: maxAge,
      };

      localStorage.setItem("auth_token", JSON.stringify(tokenData));
    }
  }

  /**
   * Retrieve token from secure storage
   */
  getToken(): string | null {
    if (!this.isClient) return null;

    try {
      // First try sessionStorage (most secure client-side option)
      const sessionToken = sessionStorage.getItem("session_token");
      if (sessionToken) {
        return sessionToken;
      }

      // Check if we have a secure cookie by calling our API
      // This would require implementing a /api/auth/token endpoint

      // Fallback to localStorage
      const hasAuth = localStorage.getItem("has_auth");
      if (hasAuth) {
        const tokenDataStr = localStorage.getItem("auth_token");
        if (tokenDataStr) {
          const tokenData = JSON.parse(tokenDataStr);

          // Check if token has expired
          if (
            tokenData.maxAge &&
            Date.now() - tokenData.timestamp > tokenData.maxAge * 1000
          ) {
            this.removeToken();
            return null;
          }

          // If sessionStorage is empty but localStorage has token, sync it back
          if (tokenData.token && !sessionToken) {
            try {
              sessionStorage.setItem("session_token", tokenData.token);
            } catch (e) {
              console.warn("Could not sync token to sessionStorage:", e);
            }
          }

          return tokenData.token;
        }
      }

      return null;
    } catch (error) {
      console.error("Error retrieving token:", error);

      // Try a direct approach as fallback
      try {
        const directToken = localStorage.getItem("auth_token");
        if (directToken) {
          const parsed = JSON.parse(directToken);
          return parsed.token || null;
        }
      } catch (e) {
        console.error("Fallback token retrieval failed:", e);
      }

      return null;
    }
  }

  /**
   * Remove token from all storage locations
   */
  removeToken(): void {
    if (!this.isClient) return;

    try {
      // Clear sessionStorage
      sessionStorage.removeItem("session_token");

      // Clear localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("has_auth");

      // Clear secure cookie via API call
      this.clearSecureCookie();
    } catch (error) {
      console.error("Error removing token:", error);
    }
  }

  /**
   * Check if user has a valid token
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    return token !== null && token.length > 0;
  }

  /**
   * Set secure HTTP-only cookie via API call
   */
  private async setSecureCookie(
    token: string,
    options: StorageOptions,
  ): Promise<void> {
    try {
      await fetch("/api/auth/set-cookie", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, options }),
      });
    } catch (error) {
      // This will fail silently and fall back to other methods
      throw new Error("Cookie setting failed");
    }
  }

  /**
   * Clear secure HTTP-only cookie via API call
   */
  private async clearSecureCookie(): Promise<void> {
    try {
      await fetch("/api/auth/clear-cookie", {
        method: "POST",
      });
    } catch (error) {
      // This will fail silently
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Backwards compatibility helpers
export const TokenStorage = {
  getToken: () => secureStorage.getToken(),
  setToken: (token: string) => secureStorage.setToken(token),
  removeToken: () => secureStorage.removeToken(),
  hasValidToken: () => secureStorage.hasValidToken(),
};
