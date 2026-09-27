import {
  AdminDocumentListResponse,
  AuthTokens,
  DocumentItem,
  DocumentListResponse,
  DocumentStatusInfo,
  LoginResponse,
  RegisterResponse,
  User,
  UserListItem,
  UserListResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("dp_access_token");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("dp_refresh_token");
  }

  public setTokens(tokens: AuthTokens) {
    if (typeof window === "undefined") return;
    localStorage.setItem("dp_access_token", tokens.access_token);
    localStorage.setItem("dp_refresh_token", tokens.refresh_token);
  }

  public clearTokens() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("dp_access_token");
    localStorage.removeItem("dp_refresh_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true,
    retryCount = 0
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh if 401 Unauthorized
    if (response.status === 401 && requiresAuth && retryCount === 0) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem("dp_access_token", data.access_token);
            // Retry initial request
            return this.request<T>(endpoint, options, requiresAuth, retryCount + 1);
          }
        } catch {
          // If refresh fails, fall through to clearing session
        }
      }
      this.clearTokens();
    }

    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((err: { loc?: string[]; msg?: string }) => {
              const field = err.loc && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "Field";
              return `${field}: ${err.msg || "Invalid value"}`;
            })
            .join(", ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth Endpoints
  async register(data: {
    username: string;
    email: string;
    password: string;
    confirm_password: string;
  }): Promise<RegisterResponse> {
    return this.request<RegisterResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  }

  async login(data: { username: string; password: string }): Promise<LoginResponse> {
    const res = await this.request<LoginResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
    this.setTokens(res);
    return res;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  // Document Endpoints
  async getDocuments(page = 1, limit = 10): Promise<DocumentListResponse> {
    return this.request<DocumentListResponse>(`/documents?page=${page}&limit=${limit}`);
  }

  async searchDocuments(query: string): Promise<DocumentListResponse> {
    return this.request<DocumentListResponse>(`/documents/search?q=${encodeURIComponent(query)}`);
  }

  async uploadDocument(file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<DocumentItem>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  async getDocumentById(id: number): Promise<DocumentItem> {
    return this.request<DocumentItem>(`/documents/${id}`);
  }

  async getDocumentStatus(id: number): Promise<DocumentStatusInfo> {
    return this.request<DocumentStatusInfo>(`/documents/${id}/status`);
  }

  async deleteDocument(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/documents/${id}`, {
      method: "DELETE",
    });
  }

  async getExtractedText(id: number): Promise<string> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/documents/${id}/text`, { headers });
    if (!response.ok) {
      let error = "Failed to load extracted text";
      try {
        const d = await response.json();
        error = d.detail || error;
      } catch {}
      throw new Error(error);
    }
    return response.text();
  }

  getDocumentDownloadUrl(id: number): string {
    return `${API_BASE}/documents/${id}/download`;
  }

  // Admin Endpoints
  async getAdminDocuments(page = 1, limit = 10): Promise<AdminDocumentListResponse> {
    return this.request<AdminDocumentListResponse>(`/admin/documents?page=${page}&limit=${limit}`);
  }

  async getAdminUsers(page = 1, limit = 10): Promise<UserListResponse> {
    return this.request<UserListResponse>(`/admin/users?page=${page}&limit=${limit}`);
  }

  async updateUserRole(userId: number, role: "admin" | "user" | string): Promise<UserListItem> {
    return this.request<UserListItem>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
  }

  getAdminDocumentDownloadUrl(id: number): string {
    return `${API_BASE}/admin/documents/${id}/download`;
  }

  async getAdminExtractedText(id: number): Promise<string> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/admin/documents/${id}/text`, { headers });
    if (!response.ok) {
      let error = "Failed to load extracted text";
      try {
        const d = await response.json();
        error = d.detail || error;
      } catch {}
      throw new Error(error);
    }
    return response.text();
  }
}

export const api = new ApiClient();
