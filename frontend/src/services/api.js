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
    localStorage.removeItem('user_email');
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

      // Handle 401 Unauthorized token refresh
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
            errorMessage = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        } catch (_) {}
        throw new Error(errorMessage);
      }

      // If response is file download, return blob
      if (options.responseType === 'blob') {
        return await response.blob();
      }

      // Default json response
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
  async register(email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      this.setTokens(data.access_token, data.refresh_token);
      localStorage.setItem('user_email', email);
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
}

export const api = new ApiClient();
