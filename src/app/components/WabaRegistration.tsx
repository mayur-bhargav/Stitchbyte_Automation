import React, { useState } from 'react';
import apiService from '../services/apiService';

interface WabaRegistrationProps {
  onRegistrationSuccess?: () => void;
  onRegistrationError?: (error: string) => void;
}

const WabaRegistration: React.FC<WabaRegistrationProps> = ({ 
  onRegistrationSuccess, 
  onRegistrationError 
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);

  const handleRegisterWaba = async () => {
  setIsRegistering(true);
  setRegistrationStatus(null);

  try {
    const response = await apiService.registerWaba();
    
    if (response.success) {
      setRegistrationStatus('success');
      onRegistrationSuccess?.();
      alert('WhatsApp Business Account registered successfully! You can now send messages.');
    } else {
      // Handle specific API response errors
      const errorMessage = response.error || response.message || response.details || 'Registration failed';
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('WABA Registration Error:', error);
    setRegistrationStatus('error');
    
    // Extract detailed error message
    let errorMessage = 'Failed to register WhatsApp Business Account';
    
    if (error.response) {
      // API returned an error response
      const errorData = error.response.data;
      if (typeof errorData === 'string') {
        try {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.detail || parsed.error || parsed.message || errorMessage;
        } catch {
          errorMessage = errorData;
        }
      } else if (errorData) {
        errorMessage = errorData.detail || errorData.error || errorData.message || errorMessage;
      }
    } else if (error.message) {
      // Direct error message
      if (error.message.includes('{"')) {
        try {
          const parsed = JSON.parse(error.message.substring(error.message.indexOf('{"')));
          errorMessage = parsed.detail || parsed.error || parsed.message || error.message;
        } catch {
          errorMessage = error.message;
        }
      } else {
        errorMessage = error.message;
      }
    }
    
    onRegistrationError?.(errorMessage);
    
    // Show detailed error message
    alert(`Registration failed: ${errorMessage}`);
  } finally {
    setIsRegistering(false);
  }
};

  return (
    <div className="waba-registration">
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            WhatsApp Business Account Registration Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Your WABA needs to be registered with Cloud API before sending messages.
          </p>
        </div>
        <button
          onClick={handleRegisterWaba}
          disabled={isRegistering}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            isRegistering
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isRegistering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </>
          ) : (
            'Register WABA'
          )}
        </button>
      </div>
      {registrationStatus === 'success' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Registration successful! Your WhatsApp Business Account is now ready to send messages.
          </p>
        </div>
      )}
      {registrationStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ❌ Registration failed. Please try again or contact support.
          </p>
        </div>
      )}
    </div>
  );
};

export default WabaRegistration;
