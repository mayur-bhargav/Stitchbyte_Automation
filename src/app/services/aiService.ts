import { apiService } from './apiService';

export interface AIResponseConfig {
  system_prompt?: string;
  context_data?: string;
  tone?: string;
  temperature?: number;
  max_tokens?: number;
  trigger_keywords?: string;
  scope_restrictions?: {
    company_only?: boolean;
    no_technical_details?: boolean;
    no_sensitive_info?: boolean;
  };
  fallback_response?: string;
  rate_limit?: {
    per_hour?: number;
    per_day?: number;
  };
  rate_limit_message?: string;
}

export interface AIResponseResult {
  success: boolean;
  response?: string;
  error?: string;
  fallback_response?: string;
  rate_limited?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIService {
  /**
   * Process an incoming message with AI response
   */
  async processAIResponse(
    incomingMessage: string,
    config: AIResponseConfig,
    userPhone: string,
    automationId: string
  ): Promise<AIResponseResult> {
    try {
      // Check if trigger keywords are specified
      if (config.trigger_keywords && typeof config.trigger_keywords === 'string') {
        const keywords = config.trigger_keywords.split(',').map(k => k.trim().toLowerCase());
        const messageContainsKeyword = keywords.some(keyword => 
          incomingMessage.toLowerCase().includes(keyword)
        );
        
        if (!messageContainsKeyword) {
          return {
            success: false,
            error: 'Message does not contain trigger keywords',
            response: '' // No response needed
          };
        }
      }

      // Check rate limits
      const rateLimitOk = await apiService.checkAIRateLimit(userPhone, automationId);
      if (!rateLimitOk) {
        return {
          success: false,
          rate_limited: true,
          response: config.rate_limit_message || 
            'Our AI assistant has reached its usage limit. Please contact our support team.',
        };
      }

      // Generate AI response
      const aiResult = await apiService.generateAIResponse({
        message: incomingMessage,
        system_prompt: config.system_prompt,
        context_data: config.context_data,
        tone: config.tone,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        user_phone: userPhone,
        automation_id: automationId,
      });

      if (aiResult.success && aiResult.response) {
        return {
          success: true,
          response: aiResult.response,
          usage: aiResult.usage
        };
      } else {
        return {
          success: false,
          error: aiResult.error,
          response: aiResult.fallback_response || config.fallback_response || 
            'I apologize, but I cannot assist with that request. Please contact our support team.'
        };
      }

    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        response: config.fallback_response || 
          'I apologize, but I cannot process your request at the moment. Please contact our support team.'
      };
    }
  }

  /**
   * Validate AI configuration
   */
  validateAIConfig(config: AIResponseConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!config.system_prompt || config.system_prompt.trim().length === 0) {
      errors.push('System prompt is required');
    }

    // Validate temperature
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 1)) {
      errors.push('Temperature must be between 0 and 1');
    }

    // Validate max_tokens
    if (config.max_tokens !== undefined && (config.max_tokens < 10 || config.max_tokens > 1000)) {
      errors.push('Max tokens must be between 10 and 1000');
    }

    // Validate rate limits
    if (config.rate_limit?.per_hour !== undefined && config.rate_limit.per_hour < 1) {
      errors.push('Hourly rate limit must be at least 1');
    }

    if (config.rate_limit?.per_day !== undefined && config.rate_limit.per_day < 1) {
      errors.push('Daily rate limit must be at least 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get AI response preview for testing
   */
  async previewAIResponse(
    testMessage: string,
    config: AIResponseConfig
  ): Promise<AIResponseResult> {
    return this.processAIResponse(
      testMessage,
      config,
      'preview_user',
      'preview_automation'
    );
  }

  /**
   * Test connection to Gemini API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiService.generateAIResponse({
        message: 'Hello, this is a test message.',
        system_prompt: 'You are a test assistant. Respond with "Connection successful!" if you receive this message.',
        temperature: 0.1,
        max_tokens: 20
      });

      if (result.success) {
        return {
          success: true,
          message: 'Gemini API connection successful!'
        };
      } else {
        return {
          success: false,
          message: result.error || 'Connection failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
