const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getTokens() {
    return {
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token'),
    };
  }

  setTokens(access_token, refresh_token) {
    if (access_token) localStorage.setItem('access_token', access_token);
    if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
  }

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    localStorage.removeItem('is_admin');
  }

  async request(endpoint, options = {}) {
    const { accessToken, refreshToken } = this.getTokens();
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      ...options.headers,
    };

    if (accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && refreshToken && !endpoint.includes('/auth/')) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          headers['Authorization'] = `Bearer ${localStorage.getItem('access_token')}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      }

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map((e) => e.msg || e.message).join(', ');
            } else {
              errorMessage = typeof errorData.detail === 'string' 
                ? errorData.detail 
                : JSON.stringify(errorData.detail);
            }
          }
        } catch (_) {}
        throw new Error(errorMessage);
      }

      if (options.responseType === 'blob') {
        return await response.blob();
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }

  // Auth Endpoints
  async register(username, email, password, confirmPassword) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username,
        email,
        password,
        confirm_password: confirmPassword,
      }),
    });
  }

  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
      localStorage.setItem('username', data.username || username);
      localStorage.setItem('is_admin', data.is_admin ? 'true' : 'false');
    }
    return data;
  }

  async refreshToken() {
    const { refreshToken } = this.getTokens();
    if (!refreshToken) return false;

    try {
      const data = await this.request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (data.access_token) {
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      }
    } catch (e) {
      this.clearTokens();
    }
    return false;
  }

  logout() {
    this.clearTokens();
  }

  // Document Endpoints
  async getDocuments(page = 1, limit = 10) {
    return this.request(`/documents?page=${page}&limit=${limit}`);
  }

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async getDocumentById(id) {
    return this.request(`/documents/${id}`);
  }

  async getDocumentText(id) {
    return this.request(`/documents/${id}/text`);
  }

  async downloadDocument(id) {
    return this.request(`/documents/${id}/download`, {
      responseType: 'blob',
    });
  }

  async deleteDocument(id) {
    return this.request(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  // Search Endpoint
  async searchDocuments(query, page = 1, limit = 10) {
    const encoded = encodeURIComponent(query);
    return this.request(`/search?q=${encoded}&page=${page}&limit=${limit}`);
  }

  // Admin Endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(page = 1, limit = 20) {
    return this.request(`/admin/users?page=${page}&limit=${limit}`);
  }

  async getAdminDocuments(page = 1, limit = 20) {
    return this.request(`/admin/documents?page=${page}&limit=${limit}`);
  }
}

export const api = new ApiClient();
