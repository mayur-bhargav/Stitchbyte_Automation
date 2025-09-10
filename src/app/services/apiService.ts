// Secure API service with user authentication
import BACKEND_CONFIG from '../config/backend';

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

  constructor(baseUrl: string = BACKEND_CONFIG.BASE_URL) {
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

  async signin(email: string, password: string, twoFactorCode?: string, codeType?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password,
          ...(twoFactorCode && { 
            twoFactorCode,
            codeType: codeType || 'authenticator' // default to authenticator if not specified
          })
        }),
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
      
      // If 2FA is required, return the response without setting token
      if (result.requires2FA && !twoFactorCode) {
        return result;
      }
      
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

  async resend2FACode(email: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/resend-2fa-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to resend verification code';
        try {
          const error = await response.json();
          if (error.detail) {
            errorMessage = error.detail;
          } else if (error.message) {
            errorMessage = error.message;
          }
        } catch (parseError) {
          errorMessage = `Failed to resend code: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Resend 2FA code error:', error);
      if (error instanceof Error && error.message.includes('Failed to resend')) {
        throw error;
      }
      throw new Error('Failed to resend verification code: Network error. Please try again.');
    }
  }

  // Forgot Password methods
  async forgotPassword(email: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send reset email';
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
          errorMessage = `Failed to send reset email: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      if (error instanceof Error && (
        error.message.includes('Failed to send reset email') || 
        error.message.includes('No account found with this email address')
      )) {
        throw error;
      }
      throw new Error('Failed to send reset email: Network error. Please try again.');
    }
  }

  async verifyForgotPasswordCode(email: string, code: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        let errorMessage = 'Invalid or expired verification code';
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
          errorMessage = `Code verification failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Verify forgot password code error:', error);
      if (error instanceof Error && error.message.includes('verification code')) {
        throw error;
      }
      throw new Error('Code verification failed: Network error. Please try again.');
    }
  }

  async resetPassword(email: string, code: string, newPassword: string, confirmPassword: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code, 
          new_password: newPassword, 
          confirm_password: confirmPassword 
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to reset password';
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
          errorMessage = `Password reset failed: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof Error && (
        error.message.includes('reset password') ||
        error.message.includes('same password') ||
        error.message.includes('current password')
      )) {
        throw error;
      }
      throw new Error('Password reset failed: Network error. Please try again.');
    }
  }

  async resendForgotPasswordCode(email: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/forgot-password/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to resend verification code';
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
          errorMessage = `Failed to resend code: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Resend forgot password code error:', error);
      if (error instanceof Error && error.message.includes('Failed to resend')) {
        throw error;
      }
      throw new Error('Failed to resend verification code: Network error. Please try again.');
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

  async postFormData<T = any>(endpoint: string, formData: FormData): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
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

  // Scheduled Messages methods
  async createScheduledMessage(messageData: any) {
    return this.request('/scheduled-messages/create', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getScheduledMessages() {
    return this.request('/scheduled-messages/list');
  }

  async getScheduledMessageStatus(messageId: string) {
    return this.request(`/scheduled-messages/status/${messageId}`);
  }

  async cancelScheduledMessage(messageId: string) {
    return this.request(`/scheduled-messages/cancel/${messageId}`, {
      method: 'DELETE',
    });
  }

  async getScheduledMessageContacts() {
    return this.request('/scheduled-messages/recipients/contacts');
  }

  async getScheduledMessageTemplates() {
    return this.request('/scheduled-messages/templates');
  }

  async getScheduledMessageStats() {
    return this.request('/scheduled-messages/stats');
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

  // AI Response methods using Google Gemini API directly
  async generateAIResponse(requestData: {
    message: string;
    system_prompt?: string;
    context_data?: string;
    tone?: string;
    temperature?: number;
    max_tokens?: number;
    user_phone?: string;
    automation_id?: string;
  }) {
    const GEMINI_API_KEY = 'AIzaSyAQYZH3OOGzJ0TrIjTlIV_6aKvZRYYAvjQ';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    // Build the system prompt with security restrictions
    const systemPrompt = this.buildSecureSystemPrompt(requestData);
    
    // Construct the prompt with context
    const fullPrompt = this.constructAIPrompt(requestData, systemPrompt);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: requestData.temperature || 0.7,
            maxOutputTokens: requestData.max_tokens || 150,
            topP: 0.8,
            topK: 40
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        
        // Apply additional security filtering
        const filteredResponse = this.applySecurityFiltering(aiResponse, requestData);
        
        return {
          success: true,
          response: filteredResponse,
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount || 0,
            completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: data.usageMetadata?.totalTokenCount || 0
          }
        };
      } else {
        throw new Error('No response generated by Gemini API');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback_response: requestData.system_prompt || 'I apologize, but I cannot process your request at the moment. Please contact our support team for assistance.'
      };
    }
  }

  private buildSecureSystemPrompt(requestData: any): string {
    const basePrompt = requestData.system_prompt || 'You are a helpful customer service assistant.';
    
    const securityInstructions = `
SECURITY INSTRUCTIONS (MANDATORY):
1. Only respond to questions related to our company and services
2. Never share technical details about backend systems, APIs, or infrastructure
3. Never reveal sensitive information like passwords, API keys, or internal processes
4. If asked about topics outside company scope, politely redirect to company-related topics
5. Do not provide information that could be used to hack or abuse systems
6. Stay professional and helpful within these boundaries

TONE: ${requestData.tone || 'professional'}

COMPANY CONTEXT:
${requestData.context_data || 'General customer service for our company.'}

BASE INSTRUCTIONS:
${basePrompt}
`;

    return securityInstructions;
  }

  private constructAIPrompt(requestData: any, systemPrompt: string): string {
    return `${systemPrompt}

CUSTOMER MESSAGE: "${requestData.message}"

Please provide a helpful response following all security instructions above:`;
  }

  private applySecurityFiltering(response: string, requestData: any): string {
    // List of sensitive terms that should not appear in responses
    const sensitiveTerms = [
      'api key', 'password', 'token', 'secret', 'database', 'backend', 'server',
      'hack', 'exploit', 'vulnerability', 'admin', 'root', 'ssh', 'ftp',
      'mysql', 'postgresql', 'mongodb', 'redis', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'deployment', 'environment variable'
    ];

    // Check for sensitive terms (case insensitive)
    const lowerResponse = response.toLowerCase();
    const containsSensitiveInfo = sensitiveTerms.some(term => lowerResponse.includes(term));

    if (containsSensitiveInfo) {
      return requestData.fallback_response || 
        'I can only help with questions about our company products and services. For technical support, please contact our support team directly.';
    }

    // Additional filtering for non-company related responses
    const companyKeywords = ['company', 'service', 'product', 'support', 'help', 'customer'];
    const hasCompanyContext = companyKeywords.some(keyword => lowerResponse.includes(keyword));

    if (!hasCompanyContext && requestData.scope_restrictions?.company_only) {
      return requestData.fallback_response || 
        'I can only assist with questions related to our company and services. How can I help you with our products today?';
    }

    return response;
  }

  // Simple rate limiting check (in production, this should be server-side)
  async checkAIRateLimit(userPhone: string, automationId: string): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    const rateLimitKey = `ai_rate_limit_${userPhone}_${automationId}`;
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    try {
      const storedData = localStorage.getItem(rateLimitKey);
      const rateData = storedData ? JSON.parse(storedData) : {
        hourly: { count: 0, resetTime: now + oneHour },
        daily: { count: 0, resetTime: now + oneDay }
      };

      // Reset counters if time has passed
      if (now > rateData.hourly.resetTime) {
        rateData.hourly = { count: 0, resetTime: now + oneHour };
      }
      if (now > rateData.daily.resetTime) {
        rateData.daily = { count: 0, resetTime: now + oneDay };
      }

      // Check limits (default: 10 per hour, 50 per day)
      const hourlyLimit = 10;
      const dailyLimit = 50;

      if (rateData.hourly.count >= hourlyLimit || rateData.daily.count >= dailyLimit) {
        return false;
      }

      // Increment counters
      rateData.hourly.count++;
      rateData.daily.count++;

      // Save updated data
      localStorage.setItem(rateLimitKey, JSON.stringify(rateData));
      
      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }
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
    amount?: number;
    razorpay_payment_id?: string;
    razorpay_order_id?: string;
    razorpay_signature?: string;
    stripe_payment_id?: string;
  }) {
    // Use a more forgiving request that doesn't auto-redirect on 401
    return this.requestWithoutAutoRedirect('/api/verify-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Request method that doesn't auto-redirect on 401 (for payment verification)
  private async requestWithoutAutoRedirect<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
        
        // Don't auto-redirect on 401 for payment verification
        if (response.status === 401) {
          console.warn('Payment verification failed due to authentication:', errorMessage);
          return { success: false, message: 'Authentication failed. Please refresh the page and try again.' } as T;
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Payment API Request Error:', error);
      if (error instanceof Error) {
        throw error;
      }
      // Handle unknown error types
      throw new Error(`Network error: ${String(error)}`);
    }
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

  // WooCommerce Integration methods
  async getWooCommerceStatus() {
    return this.getOptional('/connectors/woocommerce/status');
  }

  async connectWooCommerce(storeUrl: string) {
    return this.request('/connectors/woocommerce/connect', {
      method: 'POST',
      body: JSON.stringify({ store_url: storeUrl }),
    });
  }

  async disconnectWooCommerce() {
    return this.request('/connectors/woocommerce/disconnect', {
      method: 'DELETE',
    });
  }

  async testWooCommerceConnection() {
    return this.request('/connectors/woocommerce/test', {
      method: 'POST',
    });
  }

  // Shopify Integration methods (for consistency)
  async getShopifyStatus() {
    return this.getOptional('/connectors/shopify/status');
  }

  async connectShopify(shopDomain: string) {
    return this.request('/connectors/shopify/connect', {
      method: 'POST',
      body: JSON.stringify({ shop_domain: shopDomain }),
    });
  }

  async disconnectShopify() {
    return this.request('/connectors/shopify/disconnect', {
      method: 'DELETE',
    });
  }

  async testShopifyConnection() {
    return this.request('/connectors/shopify/test', {
      method: 'POST',
    });
  }

  // Transaction methods
  async getUserTransactions() {
    return this.getOptional('/plans/user/transactions');
  }

  async getAllTransactions() {
    return this.getOptional('/transactions');
  }
}

// Export singleton instance
const apiService = new ApiService();
export { apiService };
export default apiService;