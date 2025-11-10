import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export interface WhatsAppRegistrationStatus {
  connected: boolean;
  registered: boolean;
  requires_pin: boolean;
  phone_number?: string;
  verified_name?: string;
  last_attempt?: string;
  classification?: string;
  auto_registration_result?: {
    registered: boolean;
    requires_pin?: boolean;
    error?: string;
    classification?: string;
    user_message?: string;
    action?: string;
    hint?: string;
    help_url?: string;
  };
}

interface UseWhatsAppRegistrationReturn {
  status: WhatsAppRegistrationStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  registerPhone: (pin?: string) => Promise<{ success: boolean; message: string; requiresPin?: boolean }>;
  registering: boolean;
}

export function useWhatsAppRegistration(): UseWhatsAppRegistrationReturn {
  const [status, setStatus] = useState<WhatsAppRegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getWhatsAppRegistrationStatus();
      setStatus(data as WhatsAppRegistrationStatus);
    } catch (err: any) {
      console.error('Failed to fetch registration status:', err);
      setError(err.message || 'Failed to fetch registration status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const registerPhone = useCallback(async (pin?: string) => {
    setRegistering(true);
    setError(null);
    
    try {
      const result = await apiService.registerWhatsAppPhone(pin) as any;
      
      // Success case
      if (result.success || result.registered) {
        await fetchStatus(); // Refresh status
        return {
          success: true,
          message: result.message || '✅ WhatsApp number registered successfully!',
        };
      }
      
      // Should not reach here in success case, but handle gracefully
      return {
        success: false,
        message: result.message || 'Registration failed',
        requiresPin: result.requires_pin,
      };
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Parse error response
      const errorDetail = err.response?.data?.detail || err.message;
      
      if (typeof errorDetail === 'object') {
        // Structured error from backend
        return {
          success: false,
          message: errorDetail.message || errorDetail.user_message || 'Registration failed',
          requiresPin: errorDetail.requires_pin || false,
        };
      }
      
      // Generic error
      return {
        success: false,
        message: typeof errorDetail === 'string' ? errorDetail : 'Registration failed',
      };
    } finally {
      setRegistering(false);
      await fetchStatus(); // Always refresh status after attempt
    }
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
    registerPhone,
    registering,
  };
}
