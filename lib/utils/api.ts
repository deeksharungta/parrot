// Import the new secure API client
export { apiClient, secureApiClient } from "../secure-api-client";

// Deprecated - kept for backwards compatibility
// Remove client-side API secret usage
const getSecureHeaders = () => ({
  "Content-Type": "application/json",
  // Removed: "x-api-key": process.env.NEXT_PUBLIC_API_SECRET || "",
});

// Legacy functions - these will be gradually migrated to use secureApiClient
export const legacyApiClient = {
  async createUser(userData: any) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: getSecureHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getUser(id: string) {
    const response = await fetch(`/api/users?id=${id}`, {
      headers: getSecureHeaders(),
    });
    return response.json();
  },

  async updateUser(id: string, userData: any) {
    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: getSecureHeaders(),
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async updateSettings(id: string, settings: any) {
    const response = await fetch(`/api/users/${id}/settings`, {
      method: "PUT",
      headers: getSecureHeaders(),
      body: JSON.stringify(settings),
    });
    return response.json();
  },

  async updateBalance(
    id: string,
    amount: number,
    operation: "add" | "subtract",
  ) {
    const response = await fetch(`/api/users/${id}/balance`, {
      method: "PUT",
      headers: getSecureHeaders(),
      body: JSON.stringify({ amount, operation }),
    });
    return response.json();
  },
};
