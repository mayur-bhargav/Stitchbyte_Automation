// Secure API service with user authentication
class ApiService {
  async validateWaba(): Promise<any> {
    return this.post('/whatsapp/validate-waba', {});
  }

  // Keep the old method for backward compatibility but point to new endpoint
  async registerWaba(): Promise<any> {
    return this.validateWaba();
  }
  // Create Razorpay order before payment
  async createOrder(planId: string) {
    return this.request('/subscription/create-payment-order', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }
  // Debug utility: decode JWT token payload
  public static decodeToken(token: string) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded JWT payload:', payload);
      return payload;
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.loadToken();
  }

  get baseURL() {
    return this.baseUrl;
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  // Method to ensure token is properly set after signup/signin
  private setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  // Method to verify token is working
  public async verifyToken(): Promise<boolean> {
    this.loadToken();
    if (!this.token) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Method to check if backend is available
  public async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        timeout: 5000, // 5 second timeout
      } as any);
      return response.ok;
    } catch {
      try {
        // Fallback: try a simple endpoint
        const response = await fetch(`${this.baseUrl}/`, {
          method: 'GET',
          timeout: 5000,
        } as any);
        return response.status < 500; // Any response except server error
      } catch {
        return false;
      }
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Authentication methods
  async signup(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
  }) {
    const response = await fetch(`${this.baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    const result = await response.json();
    // Support both 'token' and 'access_token' for compatibility
    const token = result.token || result.access_token;
    if (!token) {
      console.error('Signup response missing token:', result);
      throw new Error('Signup failed: No token returned from server.');
    }
    
    // Use the new setToken method for proper token handling
    this.setToken(token);
    
    return result;
  }

  async signin(email: string, password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Signin failed';
        try {
          const error = await response.json();
          if (error.detail) {
            errorMessage = error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.error) {
            errorMessage = error.error;
          }
        } catch (parseError) {
          errorMessage = `Signin failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      // Support both 'token' and 'access_token' for compatibility
      const token = result.token || result.access_token;
      if (!token) {
        console.error('Signin response missing token:', result);
        throw new Error('Signin failed: No token returned from server.');
      }
    
      // Use the new setToken method for proper token handling
      this.setToken(token);
      
      return result;
    } catch (error) {
      // Re-throw our custom errors (authentication/server errors)
      if (error instanceof Error && error.message.includes('Signin failed')) {
        throw error;
      }
      
      // Handle network errors and other unexpected errors
      console.error('Network or unexpected error during signin:', error);
      throw new Error('Signin failed: Network error or server is unavailable. Please try again.');
    }
  }

  async getCurrentUser() {
    this.loadToken();
    if (!this.token) {
      // No token means user is not authenticated - this is normal for first-time visitors
      // Don't redirect here, let the calling component handle the unauthenticated state
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          // Token is invalid or expired
          this.logout();
          return null;
        }
        throw new Error('Failed to get user info');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get current user error:', error);
      // Don't automatically redirect on network errors
      // Let the calling component decide what to do
      return null;
    }
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    this.loadToken(); // Refresh token for each request
    
    const url = `${this.baseUrl}${endpoint}`;
    // Merge headers and drop JSON content-type for FormData bodies
    const mergedHeaders: Record<string, any> = { ...this.getHeaders(), ...(options.headers || {}) };
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    if (isFormData && mergedHeaders['Content-Type']) {
      delete mergedHeaders['Content-Type'];
    }
    const config: RequestInit = {
      ...options,
      headers: mergedHeaders,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          this.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
          throw new Error('Authentication required');
        }
        
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            errorMessage = error.detail || error.message || JSON.stringify(error);
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      // Handle unknown error types
      throw new Error(`Network error: ${String(error)}`);
    }
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Optional GET request that doesn't throw errors for 404s
  async getOptional<T = any>(endpoint: string): Promise<T | null> {
    this.loadToken(); // Refresh token for each request
    
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method: 'GET',
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect to login
          this.logout();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/signin';
          }
          return null;
        }
        
        if (response.status === 404) {
          // Not found - return null for optional endpoints
          console.log(`Optional endpoint ${endpoint} not found (404), returning null`);
          return null;
        }
        
        // For other errors, still throw
        let errorMessage = 'Request failed';
        try {
          const error = await response.json();
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error && typeof error === 'object') {
            errorMessage = error.detail || error.message || JSON.stringify(error);
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.log(`Optional endpoint ${endpoint} failed, returning null:`, error);
      return null;
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async delete<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Templates methods
  async getTemplates() {
    return this.request('/templates');
  }

  async createTemplate(templateData: any) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateTemplate(templateId: string, templateData: any) {
    return this.request(`/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteTemplate(templateId: string) {
    return this.request(`/templates/${templateId}`, {
      method: 'DELETE',
    });
  }

  // Contacts methods
  async getContacts() {
    return this.request('/contacts');
  }

  async createContact(contactData: any) {
    return this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  }

  async updateContact(contactId: string, contactData: any) {
    return this.request(`/contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify(contactData),
    });
  }

  async deleteContact(contactId: string) {
    return this.request(`/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  async importContacts(contacts: any[]) {
    return this.request('/contacts/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ contacts }),
    });
  }

  // Messages methods
  async sendMessage(messageData: any) {
    return this.request('/send-message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async sendBulkMessage(messageData: any) {
    return this.request('/send-bulk-message', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getMessageLogs() {
    return this.request('/logs');
  }

  // Broadcasts methods
  async getBroadcasts() {
    return this.request('/broadcasts');
  }

  async createBroadcast(broadcastData: any) {
    return this.request('/broadcasts', {
      method: 'POST',
      body: JSON.stringify(broadcastData),
    });
  }

  async updateBroadcast(broadcastId: string, broadcastData: any) {
    return this.request(`/broadcasts/${broadcastId}`, {
      method: 'PUT',
      body: JSON.stringify(broadcastData),
    });
  }

  async deleteBroadcast(broadcastId: string) {
    return this.request(`/broadcasts/${broadcastId}`, {
      method: 'DELETE',
    });
  }

  // Automations methods
  async getAutomations() {
    return this.request('/automations/');
  }

  async createAutomation(automationData: any) {
    return this.request('/automations', {
      method: 'POST',
      body: JSON.stringify(automationData),
    });
  }

  async updateAutomation(automationId: string, automationData: any) {
    return this.request(`/automations/${automationId}`, {
      method: 'PUT',
      body: JSON.stringify(automationData),
    });
  }

  async patchAutomation(automationId: string, updates: any) {
    if (!automationId) {
      throw new Error('Invalid automation id');
    }

    try {
      return await this.request(`/automations/${automationId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    } catch (err) {
      // Some backends may not support PATCH. If we get a 405 Method Not Allowed,
      // retry with PUT as a fallback.
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('405') || /method not allowed/i.test(message)) {
        return await this.request(`/automations/${automationId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      }
      throw err;
    }
  }

  async deleteAutomation(automationId: string) {
    return this.request(`/automations/${automationId}`, {
      method: 'DELETE',
    });
  }

  // Plan and Subscription methods
  async getPlans() {
    return this.request('/plans');
  }

  async getSubscription() {
    return this.request('/subscription');
  }

  async selectPlan(planId: string) {
    return this.request('/plans/select', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async createPaymentOrder(planId: string) {
    return this.request('/create-payment-order', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    });
  }

  async verifyPayment(paymentData: {
    plan_id: string;
    payment_method: string;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
  }) {
    return this.request('/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Status and health check methods
  async getSystemStatus() {
    return this.getOptional('/status');
  }

  async getHealthCheck() {
    return this.getOptional('/health');
  }

  async getMetrics() {
    return this.getOptional('/metrics');
  }

  async getServiceStatus() {
    return this.getOptional('/status/services');
  }

  async getIncidents() {
    return this.getOptional('/status/incidents');
  }

  async getUptime() {
    return this.getOptional('/status/uptime');
  }

  // Analytics and statistics
  async getAnalytics() {
    return this.getOptional('/analytics');
  }

  async getDashboardStats() {
    return this.getOptional('/analytics/dashboard');
  }

  // Test API connectivity
  async testApiConnectivity() {
    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        status: response.ok ? 'operational' : 'degraded',
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'outage',
        responseTime: null,
        statusCode: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Meta/WhatsApp OAuth methods
  async getMetaOAuthUrl() {
    return this.request('/api/auth/meta/connect');
  }

  async connectMetaAccount(code: string, state: string) {
    return this.request('/api/auth/meta/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  async disconnectMetaAccount() {
    return this.request('/api/auth/meta/disconnect', {
      method: 'POST',
    });
  }

  async getMetaConnectionStatus() {
    return this.getOptional('/api/auth/meta/status');
  }

  // WhatsApp configuration methods
  async getWhatsAppConfig(companyId?: string) {
    const endpoint = companyId ? `/whatsapp/config?companyId=${companyId}` : '/whatsapp/config';
    console.log(`🔍 Fetching WhatsApp config from: ${this.baseUrl}${endpoint}`);
    console.log(`🔑 Token available: ${!!this.token}`);
    console.log(`📧 Company ID: ${companyId}`);
    
    const result = await this.getOptional(endpoint);
    console.log(`📋 WhatsApp config result:`, result);
    return result;
  }

  async refreshWhatsAppConfig() {
    return this.request('/whatsapp/refresh-config', {
      method: 'POST',
    });
  }

  async getReconnectUrl() {
    return this.request('/whatsapp/reconnect-url', {
      method: 'POST',
    });
  }

  async deleteWhatsAppConfig() {
    return this.request('/whatsapp/config', {
      method: 'DELETE',
    });
  }

  // WhatsApp Business Profile methods
  async updateWhatsAppBusinessProfile(data: { category?: string; about?: string }) {
    return this.request('/whatsapp/business-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadWhatsAppBusinessPhoto(formData: FormData) {
    return this.request('/whatsapp/business-profile/photo', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData - let browser set it
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : undefined,
    });
  }

  // Profile management methods
  async getProfile() {
    return this.request('/profile/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('/profile/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePicture(formData: FormData) {
    return this.request('/profile/auth/me/profile-picture', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header for FormData - let browser set it
      headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : undefined,
    });
  }

  async updateNotificationSettings(settings: any) {
    return this.request('/profile/auth/me/notifications', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateSecuritySettings(settings: any) {
    return this.request('/profile/auth/me/security', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async updateUserPreferences(preferences: any) {
    return this.request('/profile/auth/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/profile/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(data: { password: string; confirmation: string }) {
    return this.request('/profile/auth/me', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;