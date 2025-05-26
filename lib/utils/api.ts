export const apiClient = {
  async createUser(userData: any) {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async getUser(id: string) {
    const response = await fetch(`/api/users?id=${id}`);
    return response.json();
  },

  async updateUser(id: string, userData: any) {
    const response = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  async updateSettings(id: string, settings: any) {
    const response = await fetch(`/api/users/${id}/settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, operation }),
    });
    return response.json();
  },
};
